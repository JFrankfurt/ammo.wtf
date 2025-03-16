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
  const [state, setState] = useState<SwapState>({
    loading: false,
    error: null,
    txHash: null,
    quote: null,
  });

  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Store the current swap parameters for simulation
  const [currentSwapConfig, setCurrentSwapConfig] = useState<{
    commands: `0x${string}`;
    inputs: `0x${string}`[];
    deadline: bigint;
  } | null>(null);

  const getQuote = useCallback(
    async ({
      tokenIn,
      tokenOut,
      amount,
      slippagePercentage,
    }: SwapParams): Promise<void> => {
      if (!address || !publicClient) return;

      setState((prev) => ({ ...prev, loading: true }));

      try {
        const parsedAmount = parseUnits(amount, 6); // USDC has 6 decimals

        // Step 1: Encode the Universal Router command for V4 swap
        const commands = encodePacked(["uint8"], [0x20]) as `0x${string}`;

        // Step 2: Create the actions bytes - in same order as Solidity example:
        // SWAP_EXACT_IN_SINGLE (0), SETTLE_ALL (1), TAKE_ALL (2)
        const actions = encodePacked(
          ["uint8", "uint8", "uint8"],
          [Actions.SWAP_EXACT_IN_SINGLE, Actions.SETTLE_ALL, Actions.TAKE_ALL]
        );

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

        // zeroForOne is true if we're swapping token0 for token1
        // Assuming USDC is token0 in the pool
        const zeroForOne = true;

        // Parameter for SWAP_EXACT_IN_SINGLE - using abi.encode equivalent
        // This is similar to the IV4Router.ExactInputSingleParams struct in Solidity
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
          args: [
            {
              poolKey,
              zeroForOne,
              amountIn: parsedAmount,
              amountOutMinimum: BigInt(0),
              sqrtPriceLimitX96: BigInt(0),
              hookData:
                "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
            },
          ],
        });

        // Parameter for SETTLE_ALL - encodes (currency0, amountIn)
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
          args: [poolKey.currency0, parsedAmount],
        });

        // Parameter for TAKE_ALL - encodes (currency1, amountOutMinimum)
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
          args: [poolKey.currency1, BigInt(0)],
        });

        // Create the params array - MUST be size 3 matching the actions
        const params = [swapParam, settleParam, takeParam];

        // Combine actions and params into inputs
        // This is equivalent to Solidity's abi.encode(actions, params)
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
            args: [actions, params],
          }),
        ];

        const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800);

        // Store the config for later use in the contract write
        setCurrentSwapConfig({
          commands,
          inputs,
          deadline,
        });

        // Calculate fee (0.3% of input amount)
        const feeAmount = (parseFloat(amount) * 0.003).toFixed(6);
        const priceImpact = "< 1%";

        // Simulate the contract call using publicClient directly for the quote
        await publicClient.simulateContract({
          address: SWAP_ROUTER_02_ADDRESS[chainId],
          abi: UNIVERSAL_ROUTER_ABI,
          functionName: "execute",
          args: [commands, inputs, deadline],
          account: address,
        });

        // For simulation purposes, we'll use a placeholder value
        // In a real implementation, you would extract the actual output amount from the simulation result
        const simulatedOutputAmount = BigInt(0);

        setState((prev) => ({
          ...prev,
          loading: false,
          quote: {
            outputAmount: formatUnits(simulatedOutputAmount, 18),
            fee: feeAmount,
            priceImpact,
          },
        }));
      } catch (error) {
        console.error("Error getting quote:", error);
        setState((prev) => ({ ...prev, quote: null }));
      }
    },
    [address, chainId, publicClient]
  );

  const checkAndApproveToken = useCallback(
    async (tokenAddress: string, amount: string): Promise<boolean> => {
      if (!address || !walletClient) return false;

      try {
        // Check current allowance
        const allowance = (await publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: AMMO_TOKEN_ERC20_ABI,
          functionName: "allowance",
          args: [address, SWAP_ROUTER_02_ADDRESS[chainId]],
        })) as bigint;

        // If allowance is insufficient, approve
        if (allowance < BigInt(amount)) {
          const { request } = await publicClient.simulateContract({
            address: tokenAddress as `0x${string}`,
            abi: AMMO_TOKEN_ERC20_ABI,
            functionName: "approve",
            args: [SWAP_ROUTER_02_ADDRESS[chainId], BigInt(amount)],
            account: address,
          });

          await walletClient.writeContract(request);
        }
        return true;
      } catch (error) {
        console.error("Error in token approval:", error);
        return false;
      }
    },
    [address, chainId, publicClient, walletClient]
  );

  const swap = useCallback(
    async ({ tokenIn, tokenOut, amount, slippagePercentage }: SwapParams) => {
      if (!address || !publicClient || !walletClient || !currentSwapConfig) {
        setState((prev) => ({
          ...prev,
          error: new Error(
            "Missing required parameters or wallet not connected"
          ),
        }));
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // Check and approve token if needed
        const approved = await checkAndApproveToken(tokenIn, amount);
        if (!approved) {
          throw new Error("Token approval failed");
        }

        // Use the stored config from getQuote
        if (!currentSwapConfig) {
          throw new Error("Swap configuration not found");
        }

        const { commands, inputs, deadline } = currentSwapConfig;

        // Execute the swap using the wallet client
        const txHash = await walletClient.writeContract({
          address: SWAP_ROUTER_02_ADDRESS[chainId],
          abi: UNIVERSAL_ROUTER_ABI,
          functionName: "execute",
          args: [commands, inputs, deadline],
        });

        setState((prev) => ({ ...prev, loading: false, error: null, txHash }));
        return txHash;
      } catch (error) {
        const err = error as Error;
        console.error("Error executing swap:", err);
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
      currentSwapConfig,
    ]
  );

  return {
    state,
    getQuote,
    swap,
  };
}
