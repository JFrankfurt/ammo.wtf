import { Trade as RouterTrade } from "@uniswap/router-sdk";
import { Currency, CurrencyAmount, Token, TradeType } from "@uniswap/sdk-core";
import { useCallback, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { ERC20_ABI } from "../abi/erc20";
import { UNIVERSAL_ROUTER_ABI } from "../abi/universalRouter";
import { SWAP_ROUTER_02_ADDRESS } from "../addresses";

// Define the state interface
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

// Define the swap parameters interface
export interface SwapParams {
  tokenIn: string;
  tokenOut: string;
  amount: string;
  slippagePercentage: number;
}

/**
 * Consolidated hook for interacting with Uniswap V4 for token swaps
 * Uses Universal Router SDK and wagmi React hooks
 */
export function useUniswap(chainId: number) {
  // State for tracking the swap process
  const [state, setState] = useState<SwapState>({
    loading: false,
    error: null,
    txHash: null,
    quote: null,
  });

  // Get account, public client, and wallet client from wagmi
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  /**
   * Get token decimals
   */
  const getTokenDecimals = useCallback(
    async (tokenAddress: string): Promise<number> => {
      if (!publicClient) return 18; // Default to 18 if no client

      try {
        const decimals = await publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "decimals",
        });
        return Number(decimals);
      } catch (error) {
        console.error("Error getting token decimals:", error);
        return 18; // Default to 18 if error
      }
    },
    [publicClient]
  );

  /**
   * Get token symbol
   */
  const getTokenSymbol = useCallback(
    async (tokenAddress: string): Promise<string> => {
      if (!publicClient) return "TOKEN";

      try {
        const symbol = await publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "symbol",
        });
        return symbol as string;
      } catch (error) {
        console.error("Error getting token symbol:", error);
        return "TOKEN";
      }
    },
    [publicClient]
  );

  /**
   * Get token name
   */
  const getTokenName = useCallback(
    async (tokenAddress: string): Promise<string> => {
      if (!publicClient) return "Token";

      try {
        const name = await publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "name",
        });
        return name as string;
      } catch (error) {
        console.error("Error getting token name:", error);
        return "Token";
      }
    },
    [publicClient]
  );

  /**
   * Create a Currency instance from a token address
   */
  const createCurrency = useCallback(
    async (tokenAddress: string): Promise<Token> => {
      const decimals = await getTokenDecimals(tokenAddress);
      const symbol = await getTokenSymbol(tokenAddress);
      const name = await getTokenName(tokenAddress);

      return new Token(
        chainId,
        tokenAddress as `0x${string}`,
        decimals,
        symbol,
        name
      );
    },
    [chainId, getTokenDecimals, getTokenSymbol, getTokenName]
  );

  /**
   * Get a quote for a swap using Uniswap V4 and Universal Router SDK
   */
  const getQuote = useCallback(
    async ({ tokenIn, tokenOut, amount, slippagePercentage }: SwapParams) => {
      if (!address || !publicClient) {
        setState((prev) => ({
          ...prev,
          error: new Error("Wallet not connected"),
        }));
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // Create Currency instances
        const tokenInCurrency = await createCurrency(tokenIn);
        const tokenOutCurrency = await createCurrency(tokenOut);

        // Parse the amount with the correct decimals
        const parsedAmount = parseUnits(amount, tokenInCurrency.decimals);

        // Create CurrencyAmount for input
        const inputAmount = CurrencyAmount.fromRawAmount(
          tokenInCurrency,
          parsedAmount.toString()
        );

        // For now, we'll simulate a quote since we don't have full V4 routing yet
        // In a real implementation, we would use the Router SDK to get the best route
        const fee = 0.003; // 0.3% fee
        const outputRaw = (Number(amount) * (1 - fee)).toString();
        const outputAmount = parseUnits(outputRaw, tokenOutCurrency.decimals);

        // Create a dummy RouterTrade for now
        // In a real implementation, we would create a proper RouterTrade with V4 routes
        const routerTrade = {
          inputAmount,
          outputAmount: CurrencyAmount.fromRawAmount(
            tokenOutCurrency,
            outputAmount.toString()
          ),
          tradeType: TradeType.EXACT_INPUT,
        } as unknown as RouterTrade<Currency, Currency, TradeType>;

        // Calculate fee amount
        const feeAmount = (Number(amount) * fee).toFixed(
          tokenInCurrency.decimals
        );
        const priceImpact = "< 1%"; // Simplified price impact calculation

        // Update state with the quote
        setState((prev) => ({
          ...prev,
          loading: false,
          error: null,
          quote: {
            outputAmount: formatUnits(outputAmount, tokenOutCurrency.decimals),
            fee: feeAmount,
            priceImpact,
          },
        }));

        // Store the router trade for later use in swap
        (window as any).__routerTrade = routerTrade;
      } catch (error) {
        console.error("Error getting quote:", error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error : new Error("Unknown error"),
          quote: null,
        }));
      }
    },
    [address, publicClient, createCurrency]
  );

  /**
   * Check token allowance and approve if needed
   */
  const checkAndApproveToken = useCallback(
    async (tokenAddress: string, amount: string) => {
      if (!address || !walletClient || !publicClient) {
        console.error("Missing address, wallet client, or public client");
        return false;
      }

      try {
        // Get token decimals
        const decimals = await getTokenDecimals(tokenAddress);

        // Parse the amount with the correct decimals
        const parsedAmount = parseUnits(amount, decimals);

        // Check current allowance
        const allowance = (await publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [address, SWAP_ROUTER_02_ADDRESS[chainId]],
        })) as bigint;

        // If allowance is sufficient, return true
        if (allowance >= parsedAmount) {
          return true;
        }

        // Otherwise, approve the token
        const { request } = await publicClient.simulateContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [SWAP_ROUTER_02_ADDRESS[chainId], parsedAmount],
          account: address,
        });

        const hash = await walletClient.writeContract(request);

        // Wait for the transaction to be mined
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        return receipt.status === "success";
      } catch (error) {
        console.error("Error approving token:", error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error : new Error("Approval failed"),
        }));
        return false;
      }
    },
    [address, chainId, publicClient, walletClient, getTokenDecimals]
  );

  /**
   * Execute a swap using Universal Router SDK
   */
  const swap = useCallback(
    async ({ tokenIn, tokenOut, amount, slippagePercentage }: SwapParams) => {
      if (!address || !walletClient || !publicClient) {
        setState((prev) => ({
          ...prev,
          error: new Error(
            "Missing required parameters or wallet not connected"
          ),
        }));
        return null;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // Check and approve token
        const isApproved = await checkAndApproveToken(tokenIn, amount);
        if (!isApproved) {
          throw new Error("Token approval failed");
        }

        // Get the router trade from the previous quote
        const routerTrade = (window as any).__routerTrade as RouterTrade<
          Currency,
          Currency,
          TradeType
        >;

        if (!routerTrade) {
          throw new Error("No quote available. Please get a quote first.");
        }

        // For now, we'll use a simplified approach since we're still in development
        // In a production environment, we would use the full Universal Router SDK capabilities

        // Create a deadline 30 minutes from now
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800);

        // Execute a simple swap directly using the Universal Router
        // This is a placeholder - in a real implementation, we would use the proper encoded calldata
        const hash = await walletClient.writeContract({
          address: SWAP_ROUTER_02_ADDRESS[chainId],
          abi: UNIVERSAL_ROUTER_ABI,
          functionName: "execute",
          args: [
            "0x" as `0x${string}`, // commands - placeholder
            [] as readonly `0x${string}`[], // inputs - placeholder
            deadline,
          ],
          value: BigInt(0), // No ETH being sent
        });

        // Update state with the transaction hash
        setState((prev) => ({ ...prev, loading: false, txHash: hash }));
        return hash;
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Swap failed");
        console.error("Error executing swap:", err);
        setState((prev) => ({ ...prev, loading: false, error: err }));
        throw err;
      }
    },
    [address, chainId, publicClient, walletClient, checkAndApproveToken]
  );

  // Return the hook interface
  return {
    state,
    getQuote,
    swap,
    checkAndApproveToken,
  };
}
