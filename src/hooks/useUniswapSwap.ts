import { Actions } from "@uniswap/v4-sdk";
import { useCallback, useState } from "react";
import {
  encodeAbiParameters,
  encodePacked,
  formatUnits,
  parseAbiParameters,
  parseUnits,
} from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import AMMO_TOKEN_ERC20_ABI from "../abi/ammoTokenERC20";
import { UNIVERSAL_ROUTER_ABI } from "../abi/universalRouter";
import { UNIVERSAL_ROUTER_ADDRESSES } from "../addresses";
import { logger } from "../utils/logger";

// Define the PoolKey structure type matching Solidity for clarity
type PoolKey = {
  currency0: `0x${string}`;
  currency1: `0x${string}`;
  fee: number; // uint24
  tickSpacing: number; // int24
  hooks: `0x${string}`;
};

// Define the ExactInputSingleParams structure type matching Solidity
type ExactInputSingleParams = {
  poolKey: PoolKey;
  zeroForOne: boolean;
  amountIn: bigint;
  amountOutMinimum: bigint;
  // Assuming sqrtPriceLimitX96 and hookData are needed based on interface
  sqrtPriceLimitX96: bigint;
  hookData: `0x${string}`;
};

// Define the structure for the parameters passed to encodeAbiParameters for the swap param
const exactInputSingleParamsAbi = [
  {
    name: "params",
    type: "tuple",
    components: [
      {
        name: "poolKey",
        type: "tuple",
        components: [
          { name: "currency0", type: "address" },
          { name: "currency1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickSpacing", type: "int24" },
          { name: "hooks", type: "address" },
        ],
      },
      { name: "zeroForOne", type: "bool" },
      { name: "amountIn", type: "uint128" }, // Use uint128 if appropriate, else uint256
      { name: "amountOutMinimum", type: "uint128" }, // Use uint128 if appropriate, else uint256
      { name: "sqrtPriceLimitX96", type: "uint160" },
      { name: "hookData", type: "bytes" },
    ],
  },
] as const; // Use 'as const' for better type inference

// Define the structure for the final input combining actions and params array
const executeV4SwapInputAbi = parseAbiParameters('bytes actions, bytes[] params');

export interface SwapState {
  loading: boolean;
  error: Error | null;
  txHash: string | null;
  quote: {
    outputAmount: string;
    fee: string;
    priceImpact: string;
  } | null;
}

export interface SwapParams {
  tokenIn: string; // This represents the token the user *has* (e.g., USDC)
  tokenOut: string; // This represents the token the user *wants* (e.g., AMMO)
  amount: string; // Amount of tokenIn
  slippagePercentage: number; // Not currently used in quote/swap logic
}

export function useUniswapSwap(chainId: number) {
  logger.debug('useUniswapSwap', 'useUniswapSwap initialized', { chainId });
  const [state, setState] = useState<SwapState>({
    loading: false,
    error: null,
    txHash: null,
    quote: null,
  });
  logger.debug('useUniswapSwap', 'Initial state set', { state });

  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  logger.debug('useUniswapSwap', 'Wagmi hooks initialized', { address, hasPublicClient: !!publicClient, hasWalletClient: !!walletClient });

  // Store the prepared arguments for the execute call
  const [currentSwapArgs, setCurrentSwapArgs] = useState<{
    commands: `0x${string}`;
    inputs: `0x${string}`[];
    deadline: bigint;
  } | null>(null);
  logger.debug('useUniswapSwap', 'Initial currentSwapArgs set to null');

  const getQuote = useCallback(
    async ({
      tokenIn,
      tokenOut,
      amount,
    }: SwapParams): Promise<void> => {
      logger.debug('useUniswapSwap', 'getQuote called', { tokenIn, tokenOut, amount, address });
      if (!address || !publicClient) {
          logger.warn('getQuote skipped: Missing address or publicClient', { address, hasPublicClient: !!publicClient });
          return;
      }

      logger.debug('useUniswapSwap', 'Setting loading state to true for quote');
      setState((prev) => ({ ...prev, loading: true, error: null, quote: null })); // Clear previous quote/error

      try {
        const decimalsIn = 6;
        const parsedAmountIn = parseUnits(amount, decimalsIn);
        logger.debug('useUniswapSwap', 'Parsed amount for quote', { amount, decimalsIn, parsedAmountIn: parsedAmountIn.toString() });

        // 1. Encode Commands
        // 0x10 appears to be the correct command byte for V4 swaps on the target Universal Router (Base).
        // This was confirmed by analyzing successful transaction: 0x91204755c237d4a2799aa7f215b670ed837d9535e5a6887b89d2ddd875772cbf
        const commands = encodePacked(["uint8"], [0x10]);
        logger.debug('useUniswapSwap', 'Encoded commands', { commands });

        // 2. Encode V4 Router Actions
        // These define the steps within the V4 swap itself
        const actions = encodePacked(
          ["uint8", "uint8", "uint8"],
          [Actions.SWAP_EXACT_IN_SINGLE, Actions.SETTLE_ALL, Actions.TAKE_ALL]
        );
        logger.debug('useUniswapSwap', 'Encoded actions', { actions });

        // 3. Determine PoolKey and swap direction
        const currencyA = tokenIn as `0x${string}`;
        const currencyB = tokenOut as `0x${string}`;
        const [currency0, currency1] =
          BigInt(currencyA) < BigInt(currencyB)
            ? [currencyA, currencyB]
            : [currencyB, currencyA];
        const zeroForOne = currencyA === currency0; // True if swapping token0 (lower address) for token1 (higher address)
        logger.debug('useUniswapSwap', 'Determined pool order', { currency0, currency1, zeroForOne });

        // TODO: Fetch fee/tickSpacing/hooks dynamically if possible, or use reliable constants
        const fee = 3000;
        const tickSpacing = 60;
        const hooks = "0x0000000000000000000000000000000000000000" as `0x${string}`;
        const poolKey: PoolKey = { currency0, currency1, fee, tickSpacing, hooks };
        logger.debug('useUniswapSwap', 'Constructed poolKey', { poolKey });

        // 4. Prepare and encode individual parameters for each action
        //    These will form the `params` array in the final encoding step

        // Param 1: SWAP_EXACT_IN_SINGLE
        const swapParamsData: ExactInputSingleParams = {
          poolKey,
          zeroForOne,
          amountIn: parsedAmountIn,
          amountOutMinimum: BigInt(1), // TODO: Calculate based on slippage
          sqrtPriceLimitX96: BigInt(0), // Set to 0 for no limit unless required
          hookData: "0x0",
        };
        const encodedSwapParam = encodeAbiParameters(exactInputSingleParamsAbi, [swapParamsData]);
        logger.debug('useUniswapSwap', 'Encoded swapParam', { swapParamsData, encodedSwapParam });

        // Param 2: SETTLE_ALL
        // Use the actual input currency and amount
        const settleCurrency = zeroForOne ? poolKey.currency0 : poolKey.currency1; // Should match tokenIn
        const encodedSettleParam = encodeAbiParameters(
          parseAbiParameters("address currency, uint256 amount"),
          [settleCurrency, parsedAmountIn]
        );
        logger.debug('useUniswapSwap', 'Encoded settleParam', { settleCurrency, parsedAmountIn, encodedSettleParam });

        // Param 3: TAKE_ALL
        // Use the output currency and the minimum amount expected
        const takeCurrency = zeroForOne ? poolKey.currency1 : poolKey.currency0; // Should match tokenOut
        const amountOutMinimum = BigInt(0); // TODO: Calculate based on slippage
        const encodedTakeParam = encodeAbiParameters(
          parseAbiParameters("address currency, uint256 amountMinimum"),
          [takeCurrency, amountOutMinimum]
        );
        logger.debug('useUniswapSwap', 'Encoded takeParam', { takeCurrency, amountOutMinimum, encodedTakeParam });

        // --- Construct `inputs` argument for router.execute ---
        // Combine `actions` and the array of encoded params (`params`)
        // into a single bytes string, which becomes inputs[0].
        const paramsArray = [encodedSwapParam, encodedSettleParam, encodedTakeParam];
        const executeV4SwapInputEncoded = encodeAbiParameters(
          executeV4SwapInputAbi, // Uses abi definition: (bytes actions, bytes[] params)
          [actions, paramsArray]
        );
        logger.debug('useUniswapSwap', 'Encoded final V4 Swap input (actions + params)', { actions, paramsArray, executeV4SwapInputEncoded });

        // The 'inputs' array passed to router.execute contains just this one combined element
        const inputs: `0x${string}`[] = [executeV4SwapInputEncoded];
        logger.debug('useUniswapSwap', 'Constructed execute inputs array for router', { inputs });


        // 5. Prepare Deadline
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800); // 30 minutes
        logger.debug('useUniswapSwap', 'Calculated deadline', { deadline: deadline.toString() });

        // Store the correctly prepared arguments
        const argsToStore = { commands, inputs, deadline };
        setCurrentSwapArgs(argsToStore);
        logger.debug('useUniswapSwap', 'Stored currentSwapArgs for execution', { currentSwapArgs: argsToStore });

        // --- Simulation & Quote Generation ---
        const feeAmount = (parseFloat(amount) * (fee / 1_000_000)).toFixed(decimalsIn); // Rough estimate
        const priceImpact = "< 1%"; // Placeholder
        logger.debug('useUniswapSwap', 'Calculated cosmetic fee and price impact', { feeAmount, priceImpact });

        logger.debug('useUniswapSwap', 'Simulating swap contract call for quote...', { address: UNIVERSAL_ROUTER_ADDRESSES[chainId], functionName: "execute", args: [commands, inputs, deadline] });
        // NOTE: QUOTE REMAINS NON-FUNCTIONAL until simulation result parsing is implemented
        const simulationResult = await publicClient.simulateContract({
          address: UNIVERSAL_ROUTER_ADDRESSES[chainId],
          abi: UNIVERSAL_ROUTER_ABI,
          functionName: "execute",
          args: [commands, inputs, deadline], // Pass correctly structured args
          account: address,
        });
        logger.debug('useUniswapSwap', 'Swap simulation successful', { simulationResult });

        const simulatedOutputAmount = BigInt(0); // Placeholder - Needs implementation
        const outputDecimals = 18; // TODO: Make dynamic
        logger.warn(
          'useUniswapSwap',
          'Using placeholder simulatedOutputAmount. Quote is inaccurate.',
          { simulatedOutputAmount: simulatedOutputAmount.toString() }
        );

        const newQuote = {
            outputAmount: formatUnits(simulatedOutputAmount, outputDecimals),
            fee: feeAmount,
            priceImpact,
        };
        logger.debug('useUniswapSwap', 'Setting final quote state', { newQuote });
        setState((prev) => ({ ...prev, loading: false, quote: newQuote }));
      } catch (error) {
        logger.error("Error getting quote:", error);
        setState((prev) => ({ ...prev, loading: false, error: error instanceof Error ? error : new Error(String(error)), quote: null }));
      }
    },
    [address, chainId, publicClient]
  );

  const checkAndApproveToken = useCallback(
    async (tokenAddress: string, amount: string): Promise<boolean> => {
      logger.debug('useUniswapSwap', 'checkAndApproveToken called', { tokenAddress, amount, address });
      if (!address || !walletClient || !publicClient) {
          logger.warn('checkAndApproveToken skipped: Missing address, walletClient or publicClient');
          return false;
      }

      try {
        const decimalsIn = 6; // TODO: Make dynamic
        const parsedAmount = parseUnits(amount, decimalsIn);
        const spender = UNIVERSAL_ROUTER_ADDRESSES[chainId];
        logger.debug('useUniswapSwap', 'Checking allowance', { tokenAddress, owner: address, spender });
        const allowance = (await publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: AMMO_TOKEN_ERC20_ABI,
          functionName: "allowance",
          args: [address, spender],
        })) as bigint;
        logger.debug('useUniswapSwap', 'Current allowance', { allowance: allowance.toString(), requiredAmount: parsedAmount.toString() });

        if (allowance < parsedAmount) {
          logger.debug('useUniswapSwap', 'Allowance insufficient, attempting approval');
          const { request } = await publicClient.simulateContract({
            address: tokenAddress as `0x${string}`,
            abi: AMMO_TOKEN_ERC20_ABI,
            functionName: "approve",
            args: [spender, parsedAmount],
            account: address,
          });
          logger.debug('useUniswapSwap', 'Approval simulation successful, sending transaction', { request });
          const approveTxHash = await walletClient.writeContract(request);
          logger.debug('useUniswapSwap', 'Approval transaction sent', { approveTxHash });
          // Optional: Wait for transaction confirmation
          // await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
          // logger.debug('useUniswapSwap', 'Approval transaction confirmed', { approveTxHash });
        } else {
            logger.debug('useUniswapSwap', 'Allowance sufficient, skipping approval');
        }
        return true;
      } catch (error) {
        logger.error("Error in token approval:", error);
        return false;
      }
    },
    [address, chainId, publicClient, walletClient]
  );

  const swap = useCallback(
    async ({ tokenIn, amount }: SwapParams) => {
      logger.debug('useUniswapSwap', 'swap called', { tokenIn, amount, address });
      if (!address || !publicClient || !walletClient || !currentSwapArgs) {
        const errorMsg = "Missing required parameters, wallet not connected, or quote not fetched";
        logger.error('Swap precondition failed', {
            hasAddress: !!address,
            hasPublicClient: !!publicClient,
            hasWalletClient: !!walletClient,
            hasCurrentSwapArgs: !!currentSwapArgs,
            errorMsg
        });
        setState((prev) => ({
          ...prev,
          error: new Error(errorMsg),
        }));
        return;
      }

      logger.debug('useUniswapSwap', 'Setting loading state to true for swap');
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const approved = await checkAndApproveToken(tokenIn, amount);
        if (!approved) {
          const approveError = new Error("Token approval failed or was rejected.");
          logger.error('Swap failed: Token approval failed', approveError);
          setState((prev) => ({ ...prev, loading: false, error: approveError }));
          throw approveError;
        }
        logger.debug('useUniswapSwap', 'Token approval successful or not needed');

        const { commands, inputs, deadline } = currentSwapArgs; // These args are now correctly structured from getQuote
        logger.debug('useUniswapSwap', 'Executing swap transaction with stored args', { address: UNIVERSAL_ROUTER_ADDRESSES[chainId], commands, inputs, deadline });

        const txHash = await walletClient.writeContract({
          address: UNIVERSAL_ROUTER_ADDRESSES[chainId],
          abi: UNIVERSAL_ROUTER_ABI,
          functionName: "execute",
          args: [commands, inputs, deadline], // Args structure is now correct
          account: address
        });
        logger.debug('useUniswapSwap', 'Swap transaction sent successfully', { txHash });

        setState((prev) => ({ ...prev, loading: false, error: null, txHash }));

        return txHash;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error("Error executing swap:", err);
        setState((prev) => ({ ...prev, loading: false, error: err }));
        throw err;
      }
    },
    [
      address,
      chainId,
      publicClient,
      walletClient,
      checkAndApproveToken,
      currentSwapArgs,
    ]
  );

  logger.debug('useUniswapSwap', 'useUniswapSwap hook setup complete. Returning state and functions.');
  return {
    state,
    getQuote,
    swap,
  };
}
