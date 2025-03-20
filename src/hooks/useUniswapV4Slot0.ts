import { CHAIN_TO_ADDRESSES_MAP, Token } from "@uniswap/sdk-core";
import { Pool } from "@uniswap/v4-sdk";
import { useMemo } from "react";
import { getAddress } from "viem";
import { useChainId, useReadContract } from "wagmi";
import UNISWAP_V4_STATE_VIEW_ABI from "../abi/uniswapV4StateView";
import { USDC_ADDRESS } from "../addresses";
import { fallbackChainId } from "../utils/chains";

// Define standard fee tiers for V4 with their corresponding tick spacings
const FEE_TIERS = {
  LOWEST: { fee: 100, tickSpacing: 1 }, // 0.01%
  LOW: { fee: 500, tickSpacing: 10 }, // 0.05%
  MEDIUM: { fee: 3000, tickSpacing: 60 }, // 0.3%
  HIGH: { fee: 10000, tickSpacing: 200 }, // 1%
};

// Define the price result interface
export interface TokenPriceResult {
  isLoading: boolean;
  error: Error | null;
  data: any[] | undefined;
}

const EMPTY_HOOK = "0x0000000000000000000000000000000000000000";

/**
 * Custom hook to fetch the price of a token against USDC using Uniswap V4
 *
 * @param tokenAddress The address of the token to get price for
 * @param tokenDecimals The number of decimals for the token (defaults to 18)
 * @returns TokenPriceResult with price information and status
 */
export function useUniswapV4Slot0(
  tokenAddress: string,
  tokenDecimals: number = 18
): TokenPriceResult {
  const chainId = useChainId();
  // Create Token instances
  const tokenUSDC = useMemo(() => {
    return new Token(
      chainId ?? fallbackChainId,
      !USDC_ADDRESS[chainId]
        ? USDC_ADDRESS[fallbackChainId]
        : USDC_ADDRESS[chainId],
      6,
      "USDC",
      "USD Coin"
    );
  }, [chainId]);

  const token = useMemo(() => {
    const formattedAddress = getAddress(tokenAddress);
    return new Token(
      chainId,
      formattedAddress,
      tokenDecimals,
      "", // Symbol not needed for price calculation
      "" // Name not needed
    );
  }, [chainId, tokenAddress, tokenDecimals]);

  const [token0, token1] = token?.sortsBefore(tokenUSDC)
    ? [token, tokenUSDC]
    : [tokenUSDC, token];

  const { fee, tickSpacing } = FEE_TIERS.MEDIUM;
  const poolId = Pool.getPoolId(
    token0,
    token1,
    fee,
    tickSpacing,
    EMPTY_HOOK
  ) as `0x${string}`;

  // @ts-expect-error chainId is not typed
  const stateViewAddress = CHAIN_TO_ADDRESSES_MAP[chainId]
    ? // @ts-expect-error chainId is not typed
      (CHAIN_TO_ADDRESSES_MAP[chainId].v4StateView as `0x${string}`)
    : (CHAIN_TO_ADDRESSES_MAP[fallbackChainId].v4StateView as `0x${string}`);

  return useReadContract({
    abi: UNISWAP_V4_STATE_VIEW_ABI,
    address: stateViewAddress,
    functionName: "getSlot0",
    args: [poolId],
  });
}
