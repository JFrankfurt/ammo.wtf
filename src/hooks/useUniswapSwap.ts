import { Actions } from "@uniswap/v4-sdk";
import { useCallback, useState } from "react";
import {
  encodeFunctionData,
  encodePacked,
  formatUnits,
  parseUnits,
} from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import AMMO_TOKEN_ERC20_ABI from "../abi/ammoTokenERC20";
import { UNIVERSAL_ROUTER_ABI } from "../abi/universalRouter";
import { SWAP_ROUTER_02_ADDRESS, USDC_ADDRESS } from "../addresses";
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
  tokenIn: string;
  tokenOut: string;
  amount: string;
  slippagePercentage: number;
}

export function useUniswapSwap(chainId: number) {
  logger.debug('useUniswapSwap initialized', { chainId });
  const [state, setState] = useState<SwapState>({
    loading: false,
    error: null,
    txHash: null,
    quote: null,
  });
  logger.debug('Initial state set', { state });

  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  logger.debug('Wagmi hooks initialized', { address, hasPublicClient: !!publicClient, hasWalletClient: !!walletClient });

  // Store the current swap parameters for simulation
  const [currentSwapConfig, setCurrentSwapConfig] = useState<{
    commands: `0x${string}`;
    inputs: `0x${string}`[];
    deadline: bigint;
  } | null>(null);
  logger.debug('Initial currentSwapConfig set to null');

  const getQuote = useCallback(
    async ({
      tokenIn,
      tokenOut,
      amount,
      slippagePercentage,
    }: SwapParams): Promise<void> => {
      logger.debug('getQuote called', { tokenIn, tokenOut, amount, slippagePercentage, address });
      if (!address || !publicClient) {
          logger.warn('getQuote skipped: Missing address or publicClient', { address, hasPublicClient: !!publicClient });
          return;
      }

      logger.debug('Setting loading state to true for quote');
      setState((prev) => ({ ...prev, loading: true, error: null, quote: null })); // Clear previous quote/error

      try {
        const parsedAmount = parseUnits(amount, 6); // USDC has 6 decimals
        logger.debug('Parsed amount for quote', { amount, parsedAmount: parsedAmount.toString() });

        // Step 1: Encode the Universal Router command for V4 swap
        const commands = encodePacked(["uint8"], [0x20]) as `0x${string}`;
        logger.debug('Encoded commands', { commands });

        // Step 2: Create the actions bytes - in same order as Solidity example:
        // SWAP_EXACT_IN_SINGLE (0), SETTLE_ALL (1), TAKE_ALL (2)
        const actions = encodePacked(
          ["uint8", "uint8", "uint8"],
          [Actions.SWAP_EXACT_IN_SINGLE, Actions.SETTLE_ALL, Actions.TAKE_ALL]
        );
        logger.debug('Encoded actions', { actions });

        // Step 3: Prepare parameters for each action

        // The poolKey parameter needs to include currencies, fee, and additional data
        // We'll create a simplified version here as we don't have a full PoolKey object
        const poolKey = {
          currency0: USDC_ADDRESS[chainId],
          currency1: tokenIn,
          fee: 3000,
          tickSpacing: 60, // Standard spacing for 0.3% fee tier
          hooks: "0x0000000000000000000000000000000000000000" as `0x${string}`,
        };
        logger.debug('Constructed poolKey', { poolKey });

        // zeroForOne is true if we're swapping token0 for token1
        // Assuming USDC is token0 in the pool
        const zeroForOne = true;
        logger.debug('Set zeroForOne', { zeroForOne });

        // Parameter for SWAP_EXACT_IN_SINGLE - using abi.encode equivalent
        // This is similar to the IV4Router.ExactInputSingleParams struct in Solidity
        const swapParamArgs = {
            poolKey,
            zeroForOne,
            amountIn: parsedAmount,
            amountOutMinimum: BigInt(0),
            sqrtPriceLimitX96: BigInt(0),
            hookData:
                "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
        };
        const swapParam = encodeFunctionData({
          abi: [
            {
              name: "exactInputSingle",
              type: "function",
              inputs: [
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
                    { name: "amountIn", type: "uint256" },
                    { name: "amountOutMinimum", type: "uint256" },
                    { name: "sqrtPriceLimitX96", type: "uint160" },
                    { name: "hookData", type: "bytes" },
                  ],
                },
              ],
            },
          ] as const,
          functionName: "exactInputSingle",
          args: [swapParamArgs],
        });
        logger.debug('Encoded swapParam', { swapParamArgs, swapParam });

        // Parameter for SETTLE_ALL - encodes (currency0, amountIn)
        const settleParamArgs = [poolKey.currency0, parsedAmount];
        const settleParam = encodeFunctionData({
          abi: [
            {
              name: "settleAll",
              type: "function",
              inputs: [
                { name: "currency", type: "address" },
                { name: "amount", type: "uint256" },
              ],
            },
          ],
          functionName: "settleAll",
          args: settleParamArgs,
        });
        logger.debug('Encoded settleParam', { settleParamArgs, settleParam });

        // Parameter for TAKE_ALL - encodes (currency1, amountOutMinimum)
        const takeParamArgs = [poolKey.currency1, BigInt(0)];
        const takeParam = encodeFunctionData({
          abi: [
            {
              name: "takeAll",
              type: "function",
              inputs: [
                { name: "currency", type: "address" },
                { name: "amountMinimum", type: "uint256" },
              ],
            },
          ],
          functionName: "takeAll",
          args: takeParamArgs,
        });
        logger.debug('Encoded takeParam', { takeParamArgs, takeParam });

        // Create the params array - MUST be size 3 matching the actions
        const params = [swapParam, settleParam, takeParam];
        logger.debug('Created params array', { params });

        // Combine actions and params into inputs
        // This is equivalent to Solidity's abi.encode(actions, params)
        const executeArgs = [actions, params];
        const inputs = [
          encodeFunctionData({
            abi: [
              {
                name: "execute",
                type: "function",
                inputs: [
                  { name: "actions", type: "bytes" },
                  { name: "params", type: "bytes[]" },
                ],
              },
            ],
            functionName: "execute",
            args: executeArgs,
          }),
        ];
        logger.debug('Encoded execute inputs', { executeArgs, inputs });

        const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800);
        logger.debug('Calculated deadline', { deadline: deadline.toString() });

        // Store the config for later use in the contract write
        const configToStore = { commands, inputs, deadline };
        setCurrentSwapConfig(configToStore);
        logger.debug('Stored currentSwapConfig for execution', { currentSwapConfig: configToStore });

        // Calculate fee (0.3% of input amount)
        const feeAmount = (parseFloat(amount) * 0.003).toFixed(6);
        const priceImpact = "< 1%";
        logger.debug('Calculated cosmetic fee and price impact', { feeAmount, priceImpact });

        // Simulate the contract call using publicClient directly for the quote
        logger.debug('Simulating swap contract call for quote...', { address: SWAP_ROUTER_02_ADDRESS[chainId], commands, inputs, deadline });
        const simulationResult = await publicClient.simulateContract({
          address: SWAP_ROUTER_02_ADDRESS[chainId],
          abi: UNIVERSAL_ROUTER_ABI,
          functionName: "execute",
          args: [commands, inputs, deadline],
          account: address,
        });
        logger.debug('Swap simulation successful', { simulationResult });

        // For simulation purposes, we'll use a placeholder value
        // In a real implementation, you would extract the actual output amount from the simulation result
        // TODO: Extract actual output amount from simulationResult if possible
        const simulatedOutputAmount = BigInt(0); // Placeholder
        logger.debug('Using placeholder simulatedOutputAmount', { simulatedOutputAmount: simulatedOutputAmount.toString() });

        const newQuote = {
            outputAmount: formatUnits(simulatedOutputAmount, 18), // Assuming output token has 18 decimals
            fee: feeAmount,
            priceImpact,
        };
        logger.debug('Setting final quote state', { newQuote });
        setState((prev) => ({
          ...prev,
          loading: false,
          quote: newQuote,
        }));
      } catch (error) {
        logger.error("Error getting quote:", error);
        setState((prev) => ({ ...prev, loading: false, error: error instanceof Error ? error : new Error(String(error)), quote: null }));
      }
    },
    [address, chainId, publicClient]
  );

  const checkAndApproveToken = useCallback(
    async (tokenAddress: string, amount: string): Promise<boolean> => {
      logger.debug('checkAndApproveToken called', { tokenAddress, amount, address });
      if (!address || !walletClient || !publicClient) {
          logger.warn('checkAndApproveToken skipped: Missing address, walletClient or publicClient');
          return false;
      }

      try {
        const parsedAmount = parseUnits(amount, 6); // Assuming input token (USDC) always has 6 decimals
        logger.debug('Checking allowance', { tokenAddress, owner: address, spender: SWAP_ROUTER_02_ADDRESS[chainId] });
        // Check current allowance
        const allowance = (await publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: AMMO_TOKEN_ERC20_ABI,
          functionName: "allowance",
          args: [address, SWAP_ROUTER_02_ADDRESS[chainId]],
        })) as bigint;
        logger.debug('Current allowance', { allowance: allowance.toString(), requiredAmount: parsedAmount.toString() });

        // If allowance is insufficient, approve
        if (allowance < parsedAmount) { // Compare with parsedAmount
          logger.debug('Allowance insufficient, attempting approval');
          const { request } = await publicClient.simulateContract({
            address: tokenAddress as `0x${string}`,
            abi: AMMO_TOKEN_ERC20_ABI,
            functionName: "approve",
            args: [SWAP_ROUTER_02_ADDRESS[chainId], parsedAmount], // Approve parsedAmount
            account: address,
          });
          logger.debug('Approval simulation successful, sending transaction', { request });
          const approveTxHash = await walletClient.writeContract(request);
          logger.debug('Approval transaction sent', { approveTxHash });
          // Optional: Wait for transaction confirmation
          // await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
          // logger.debug('Approval transaction confirmed', { approveTxHash });
        } else {
            logger.debug('Allowance sufficient, skipping approval');
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
    async ({ tokenIn, tokenOut, amount, slippagePercentage }: SwapParams) => {
      logger.debug('swap called', { tokenIn, tokenOut, amount, slippagePercentage, address });
      if (!address || !publicClient || !walletClient || !currentSwapConfig) {
        const errorMsg = "Missing required parameters or wallet not connected or quote not fetched";
        logger.error('Swap precondition failed', { 
            hasAddress: !!address, 
            hasPublicClient: !!publicClient, 
            hasWalletClient: !!walletClient, 
            hasCurrentSwapConfig: !!currentSwapConfig, 
            errorMsg 
        });
        setState((prev) => ({
          ...prev,
          error: new Error(errorMsg),
        }));
        return;
      }

      logger.debug('Setting loading state to true for swap');
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // Check and approve token if needed
        logger.debug('Checking/Approving token before swap', { tokenIn, amount });
        const approved = await checkAndApproveToken(tokenIn, amount);
        if (!approved) {
          const approveError = new Error("Token approval failed or was rejected.");
          logger.error('Swap failed: Token approval failed', approveError);
          setState((prev) => ({ ...prev, loading: false, error: approveError }));
          throw approveError; // Rethrow after setting state
        }
        logger.debug('Token approval successful or not needed');

        // Use the stored config from getQuote
        // Redundant check, already done above, but good for clarity
        if (!currentSwapConfig) {
          const configError = new Error("Swap configuration not found, cannot execute swap.");
          logger.error('Swap failed: currentSwapConfig is null unexpectedly', configError);
           setState((prev) => ({ ...prev, loading: false, error: configError }));
          throw configError;
        }

        const { commands, inputs, deadline } = currentSwapConfig;
        logger.debug('Executing swap transaction with stored config', { address: SWAP_ROUTER_02_ADDRESS[chainId], commands, inputs, deadline });

        // Execute the swap using the wallet client
        const txHash = await walletClient.writeContract({
          address: SWAP_ROUTER_02_ADDRESS[chainId],
          abi: UNIVERSAL_ROUTER_ABI,
          functionName: "execute",
          args: [commands, inputs, deadline],
          account: address // Ensure account is passed if required by walletClient setup
        });
        logger.debug('Swap transaction sent successfully', { txHash });

        setState((prev) => ({ ...prev, loading: false, error: null, txHash }));
        // Optional: Wait for transaction confirmation here if needed before returning
        // logger.debug('Waiting for swap transaction confirmation...', { txHash });
        // await publicClient.waitForTransactionReceipt({ hash: txHash });
        // logger.debug('Swap transaction confirmed', { txHash });

        return txHash;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error("Error executing swap:", err);
        setState((prev) => ({ ...prev, loading: false, error: err }));
        throw err; // Re-throw the error for the caller
      }
    },
    [
      address,
      chainId,
      publicClient,
      walletClient,
      checkAndApproveToken,
      currentSwapConfig,
    ]
  );

  logger.debug('useUniswapSwap hook setup complete. Returning state and functions.');
  return {
    state,
    getQuote,
    swap,
  };
}
