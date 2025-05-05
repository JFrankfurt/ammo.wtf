import { useCallback, useState } from "react";
import { parseUnits } from "viem";
import { readContract, simulateContract } from "@wagmi/core";
import { useAccount, useConfig, useWriteContract } from "wagmi";
import AMMO_TOKEN_ERC20_ABI from "../abi/ammoTokenERC20";
import { UNIVERSAL_ROUTER_ABI } from "../abi/universalRouter";
import { UNIVERSAL_ROUTER_ADDRESSES } from "../addresses";
import { logger } from "../utils/logger";

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
  logger.debug("useUniswapSwap", "useUniswapSwap initialized", { chainId });
  const [state, setState] = useState<SwapState>({
    loading: false,
    error: null,
    txHash: null,
    quote: null,
  });
  logger.debug("useUniswapSwap", "Initial state set", { state });

  const { address } = useAccount();
  const config = useConfig();
  logger.debug("useUniswapSwap", "Account hook initialized", { address });

  // Store the prepared arguments for the execute call
  const [currentSwapArgs, setCurrentSwapArgs] = useState<{
    commands: `0x${string}`;
    inputs: `0x${string}`[];
    deadline: bigint;
  } | null>(null);
  logger.debug("useUniswapSwap", "Initial currentSwapArgs set to null");

  // Setup write contract hooks
  const { writeContractAsync } = useWriteContract();

  const checkAndApproveToken = useCallback(
    async (tokenAddress: string, amount: string): Promise<boolean> => {
      logger.debug("useUniswapSwap", "checkAndApproveToken called", {
        tokenAddress,
        amount,
        address,
      });
      if (!address) {
        logger.warn("checkAndApproveToken skipped: Missing address");
        return false;
      }

      try {
        const decimalsIn = 6; // TODO: Make dynamic
        const parsedAmount = parseUnits(amount, decimalsIn);
        const spender = UNIVERSAL_ROUTER_ADDRESSES[chainId];

        // Read allowance using direct readContract
        const allowance = await readContract(config, {
          address: tokenAddress as `0x${string}`,
          abi: AMMO_TOKEN_ERC20_ABI,
          functionName: "allowance",
          args: [address, spender],
        });

        logger.debug("useUniswapSwap", "Current allowance", {
          allowance: allowance.toString(),
          requiredAmount: parsedAmount.toString(),
        });

        if (allowance < parsedAmount) {
          logger.debug(
            "useUniswapSwap",
            "Allowance insufficient, attempting approval"
          );

          // Simulate contract to validate the approval will succeed
          const { request } = await simulateContract(config, {
            address: tokenAddress as `0x${string}`,
            abi: AMMO_TOKEN_ERC20_ABI,
            functionName: "approve",
            args: [spender, parsedAmount],
            account: address,
          });

          logger.debug(
            "useUniswapSwap",
            "Approval simulation successful, sending transaction"
          );

          // Execute the approve transaction
          const approveTxHash = await writeContractAsync(request);

          logger.debug("useUniswapSwap", "Approval transaction sent", {
            approveTxHash,
          });
        } else {
          logger.debug(
            "useUniswapSwap",
            "Allowance sufficient, skipping approval"
          );
        }
        return true;
      } catch (error) {
        logger.error("Error in token approval:", error);
        return false;
      }
    },
    [address, chainId, config, writeContractAsync]
  );

  const swap = useCallback(
    async ({ tokenIn, amount }: SwapParams) => {
      logger.debug("useUniswapSwap", "swap called", {
        tokenIn,
        amount,
        address,
      });
      if (!address || !currentSwapArgs) {
        const errorMsg =
          "Missing required parameters, wallet not connected, or quote not fetched";
        logger.error("Swap precondition failed", {
          hasAddress: !!address,
          hasCurrentSwapArgs: !!currentSwapArgs,
          errorMsg,
        });
        setState((prev) => ({
          ...prev,
          error: new Error(errorMsg),
        }));
        return;
      }

      logger.debug("useUniswapSwap", "Setting loading state to true for swap");
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const approved = await checkAndApproveToken(tokenIn, amount);
        if (!approved) {
          const approveError = new Error(
            "Token approval failed or was rejected."
          );
          logger.error("Swap failed: Token approval failed", approveError);
          setState((prev) => ({
            ...prev,
            loading: false,
            error: approveError,
          }));
          throw approveError;
        }
        logger.debug(
          "useUniswapSwap",
          "Token approval successful or not needed"
        );

        const { commands, inputs, deadline } = currentSwapArgs;
        logger.debug(
          "useUniswapSwap",
          "Executing swap transaction with stored args",
          {
            address: UNIVERSAL_ROUTER_ADDRESSES[chainId],
            commands,
            inputs,
            deadline,
          }
        );

        // Execute the swap using writeContractAsync
        const txHash = await writeContractAsync({
          address: UNIVERSAL_ROUTER_ADDRESSES[chainId],
          abi: UNIVERSAL_ROUTER_ABI,
          functionName: "execute",
          args: [commands, inputs, deadline],
        });

        logger.debug("useUniswapSwap", "Swap transaction sent successfully", {
          txHash,
        });

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
      writeContractAsync,
      checkAndApproveToken,
      currentSwapArgs,
    ]
  );

  logger.debug(
    "useUniswapSwap",
    "useUniswapSwap hook setup complete. Returning state and functions."
  );
  return {
    state,
    swap,
  };
}
