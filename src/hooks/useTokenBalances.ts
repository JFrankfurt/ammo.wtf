import { useState, useEffect } from "react";
import { useReadContracts } from "wagmi";
import { default as erc20Abi } from "../abi/ammoTokenERC20";
import type { TokenInfo } from "../addresses";

/**
 * Custom hook to fetch balances for multiple tokens
 * @param tokens Array of token info objects
 * @param address User address to check balances for
 * @returns Object containing balances and loading state
 */
export function useTokenBalances(tokens: TokenInfo[], address?: `0x${string}`) {
  const [balances, setBalances] = useState<Record<string, number>>({});

  // Prepare contracts config for batch reading
  const contractsConfig = tokens.map((token) => ({
    address: token.address as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
  }));

  // Use wagmi's useReadContracts to batch read all token balances
  const { data, isLoading, isError } = useReadContracts({
    contracts: contractsConfig,
    query: {
      enabled: !!address && tokens.length > 0,
    },
  });

  // Update balances when data changes
  useEffect(() => {
    if (!data) return;

    const newBalances: Record<string, number> = {};

    // Initialize all tokens with zero balance
    tokens.forEach((token) => {
      newBalances[token.address] = 0;
    });

    // Update with actual balances
    data.forEach((result, index) => {
      if (result.status === "success" && result.result) {
        const tokenAddress = tokens[index].address;
        newBalances[tokenAddress] = Number(result.result) / Math.pow(10, 18);
      }
    });

    setBalances(newBalances);
  }, [data, tokens]);

  return {
    balances,
    isLoading,
    isError,
  };
}
