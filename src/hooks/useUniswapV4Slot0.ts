import { Token } from "@uniswap/sdk-core";
import { Pool } from "@uniswap/v4-sdk";
import { useMemo } from "react";
import { getAddress } from "viem";
import { useChainId, useReadContract } from "wagmi";
import UNISWAP_V4_STATE_VIEW_ABI from "../abi/uniswapV4StateView";
import {
  getChainConfig,
  SEPOLIA_CONFIG,
  SUPPORTED_CHAIN_ID,
} from "../addresses";

export interface TokenPriceResult {
  isLoading: boolean;
  error: Error | null;
  data: any[] | undefined;
}

/**
 * Fetches a token's Uniswap v4 pool state against configured Sepolia USDC.
 */
export function useUniswapV4Slot0(
  tokenAddress: string,
  tokenDecimals: number = 18
): TokenPriceResult {
  const chainId = useChainId();
  const chainConfig = getChainConfig(chainId);
  const sdkChainId = chainConfig?.chainId ?? SUPPORTED_CHAIN_ID;
  const tokenUSDC = useMemo(() => {
    return new Token(
      sdkChainId,
      chainConfig?.contracts.usdc ?? SEPOLIA_CONFIG.contracts.usdc,
      chainConfig?.decimals.usdc ?? SEPOLIA_CONFIG.decimals.usdc,
      "USDC",
      "USD Coin"
    );
  }, [chainConfig, sdkChainId]);

  const token = useMemo(() => {
    const formattedAddress = getAddress(tokenAddress);
    return new Token(
      sdkChainId,
      formattedAddress,
      tokenDecimals,
      "",
      ""
    );
  }, [sdkChainId, tokenAddress, tokenDecimals]);

  const [token0, token1] = token.sortsBefore(tokenUSDC)
    ? [token, tokenUSDC]
    : [tokenUSDC, token];
  const { fee, tickSpacing, hooks } =
    chainConfig?.pool ?? SEPOLIA_CONFIG.pool;
  const poolId = Pool.getPoolId(
    token0,
    token1,
    fee,
    tickSpacing,
    hooks
  ) as `0x${string}`;

  return useReadContract({
    abi: UNISWAP_V4_STATE_VIEW_ABI,
    address: chainConfig?.contracts.stateView,
    functionName: "getSlot0",
    args: [poolId],
    query: {
      enabled: Boolean(chainConfig),
    },
  });
}
