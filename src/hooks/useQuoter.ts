import { Token } from "@uniswap/sdk-core";
import { Pool } from "@uniswap/v4-sdk";
import { useMemo } from "react";
import { Abi, Address, parseAbiParameters, parseUnits } from "viem";
import { useChainId, useReadContract } from "wagmi";
import v4QuoterAbiJson from "@/abi/v4Quoter";
import { V4_QUOTER_ADDRESSES, USDC_ADDRESS } from "../addresses"; // Assuming addresses are defined here
import { logger } from "../utils/logger";

const V4_QUOTER_ABI = v4QuoterAbiJson as Abi;

interface UseQuoterArgs {
  /** The address of the desired output token. */
  tokenOutAddress: Address;
  /** The amount of USDC to swap, represented as a string (e.g., "100.5"). */
  amountIn: string;
  /** Optional flag to enable/disable the hook's execution. Defaults to true. */
  enabled?: boolean;
}

/**
 * React hook to fetch a swap quote for a specified amount of USDC to a target output token
 * using the Uniswap V4 Quoter contract (`quoteExactInputSingle`).
 *
 * Assumes a direct USDC -> tokenOut pool exists with predefined parameters (fee, tickSpacing, no hooks).
 * Assumes USDC has 6 decimals and the output token has 18 decimals.
 */
export function useQuoter({
  tokenOutAddress,
  amountIn,
  enabled = true,
}: UseQuoterArgs) {
  const chainId = useChainId();
  // Fetch chain-specific contract addresses
  const usdcAddress = USDC_ADDRESS[chainId];
  const quoterAddress = V4_QUOTER_ADDRESSES[chainId];

  logger.debug("useQuoter: Hook initiated", {
    chainId,
    tokenOutAddress,
    amountIn,
    enabled,
  });

  // Memoize the calculation of derived pool parameters and parsed amounts.
  // This avoids redundant computations on every render unless dependencies change.
  const { poolKey, zeroForOne, parsedAmountIn, quoteEnabled } = useMemo(() => {
    logger.debug("useQuoter: Recalculating derived parameters...");
    if (!usdcAddress || !tokenOutAddress || !amountIn || !chainId) {
      logger.warn("useQuoter: Missing required parameters for calculation.", {
        usdcAddress: !!usdcAddress,
        tokenOutAddress: !!tokenOutAddress,
        amountIn: !!amountIn,
        chainId: !!chainId,
      });
      // Return default values if prerequisites are not met
      return {
        poolKey: null,
        zeroForOne: false,
        parsedAmountIn: BigInt(0),
        quoteEnabled: false, // Explicitly disable if params are missing
      };
    }

    // Determine the order of tokens for the pool key (currency0 must have a lower address).
    const [tokenAddress0, tokenAddress1] =
      BigInt(usdcAddress) < BigInt(tokenOutAddress)
        ? [usdcAddress, tokenOutAddress]
        : [tokenOutAddress, usdcAddress];
    // `zeroForOne` is true if token0 (lower address) is the input token (USDC).
    const zeroForOne = usdcAddress === tokenAddress0;
    logger.debug("useQuoter: Determined token order", {
      tokenAddress0,
      tokenAddress1,
      zeroForOne,
    });

    // Define hardcoded decimals based on developer confirmation.
    const usdcDecimals = 6;
    const tokenOutDecimals = 18;
    logger.debug("useQuoter: Using hardcoded decimals", {
      usdcDecimals,
      tokenOutDecimals,
    });

    // Create Uniswap SDK Token instances for pool key generation.
    const currency0 = new Token(
      chainId,
      tokenAddress0,
      tokenAddress0 === usdcAddress ? usdcDecimals : tokenOutDecimals
    );
    const currency1 = new Token(
      chainId,
      tokenAddress1,
      tokenAddress1 === usdcAddress ? usdcDecimals : tokenOutDecimals
    );

    // Define hardcoded pool parameters based on developer confirmation.
    const fee = 3000; // 0.3% fee tier
    const tickSpacing = 60; // Standard spacing for 0.3% fee
    const hooks = "0x0000000000000000000000000000000000000000" as Address; // No hooks

    // Generate the V4 PoolKey using the SDK.
    const poolKey = Pool.getPoolKey(
      currency0,
      currency1,
      fee,
      tickSpacing,
      hooks
    );
    logger.debug("useQuoter: Generated PoolKey", {
      poolKey: {
        currency0: poolKey.currency0,
        currency1: poolKey.currency1,
        fee: poolKey.fee,
        tickSpacing: poolKey.tickSpacing,
        hooks: poolKey.hooks,
      },
    });

    // Parse the user-provided string amount into the smallest unit (wei equivalent) for USDC.
    let parsedAmountIn = BigInt(0);
    try {
      parsedAmountIn = parseUnits(amountIn, usdcDecimals);
      logger.debug("useQuoter: Parsed input amount", {
        amountIn,
        usdcDecimals,
        parsedAmountIn: parsedAmountIn.toString(),
      });
    } catch (error) {
      // Catch potential errors during parsing (e.g., invalid number format).
      logger.error("useQuoter: Failed to parse input amount string", {
        amountIn,
        usdcDecimals,
        error,
      });
      return {
        poolKey: null, // Invalidate poolKey if parsing fails
        zeroForOne: false,
        parsedAmountIn: BigInt(0),
        quoteEnabled: false, // Disable query if amount is invalid
      };
    }

    // Determine if the quote query should be enabled based on external flag and internal state.
    const shouldEnable = enabled && !!poolKey && parsedAmountIn > 0;
    logger.debug("useQuoter: Determined quote query enablement", {
      enabled,
      hasPoolKey: !!poolKey,
      hasAmount: parsedAmountIn > 0,
      quoteEnabled: shouldEnable,
    });

    return {
      poolKey,
      zeroForOne,
      parsedAmountIn,
      quoteEnabled: shouldEnable,
    };
    // Dependency array ensures recalculation only when these values change.
  }, [chainId, usdcAddress, tokenOutAddress, amountIn, enabled]);

  // Memoize the preparation of the arguments specifically for the V4Quoter contract call.
  const quoteArgs = useMemo(() => {
    // Do not attempt to prepare args if the pool key isn't valid (avoids errors).
    if (!poolKey) {
      logger.debug(
        "useQuoter: Skipping quoteArgs preparation, PoolKey is invalid."
      );
      return undefined;
    }

    const exactAmount = parsedAmountIn;
    // Validate that the parsed amount fits within uint128, as expected by the contract struct.
    const MAX_UINT128 = BigInt(2) ** BigInt(128) - BigInt(1);
    if (exactAmount > MAX_UINT128) {
      logger.warn(
        "useQuoter: Input amount exceeds uint128 max value. Quote might fail.",
        {
          exactAmount: exactAmount.toString(),
          MAX_UINT128: MAX_UINT128.toString(),
        }
      );
      // Consider returning undefined here to prevent the call if this is an unrecoverable error.
    }

    // Construct the parameter object matching the V4Quoter.QuoteExactSingleParams struct.
    // NOTE: `poolKey.currency0` and `poolKey.currency1` should ideally be `Address` types here.
    // The current SDK might return Token objects, requiring `.address` access. Ignoring per user request.
    const params = {
      poolKey: {
        currency0: poolKey.currency0 as Address,
        currency1: poolKey.currency1 as Address,
        fee: poolKey.fee,
        tickSpacing: poolKey.tickSpacing,
        hooks: poolKey.hooks,
      },
      zeroForOne: zeroForOne,
      exactAmount: exactAmount,
      hookData: "0x" as `0x${string}`, // No hook data needed for standard quotes.
    };
    logger.debug(
      "useQuoter: Prepared arguments object for quoteExactInputSingle",
      // Log bigint as string for readability
      { params: { ...params, exactAmount: params.exactAmount.toString() } }
    );

    // `useReadContract` expects arguments as an array, with each element corresponding
    // to a function argument. `quoteExactInputSingle` takes one struct argument (`params`).
    return [params];
  }, [poolKey, zeroForOne, parsedAmountIn]); // Dependencies for the argument preparation

  // Execute the read call to the V4 Quoter contract.
  logger.debug("useQuoter: Calling useReadContract", {
    quoterAddress: quoterAddress,
    functionName: "quoteExactInputSingle",
    hasArgs: !!quoteArgs,
    queryEnabled: quoteEnabled && !!quoteArgs,
  });
  return useReadContract({
    address: quoterAddress,
    abi: V4_QUOTER_ABI,
    functionName: "quoteExactInputSingle",
    args: quoteArgs!,
    query: {
      enabled: quoteEnabled && !!quoteArgs,
    },
  });
}
