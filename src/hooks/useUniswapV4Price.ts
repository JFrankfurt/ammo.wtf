import { useState, useEffect, useMemo } from 'react';
import { useAccount, usePublicClient, useChainId } from 'wagmi';
import { getAddress } from 'viem';
import {
  Token,
  Currency,
  CurrencyAmount,
  TradeType,
  Percent,
} from '@uniswap/sdk-core';
import { Pool, PoolKey } from '@uniswap/v4-sdk';
import { USDC_ADDRESS, POOL_MANAGER_ADDRESS, type TokenInfo } from '../addresses';
import { UNISWAP_V4_POOL_MANAGER_ABI } from '../abi/uniswapV4PoolManager';


export const EMPTY_HOOK = '0x0000000000000000000000000000000000000000'

// Define standard fee tiers for V4 with their corresponding tick spacings
const FEE_TIERS = {
  LOWEST: { fee: 100, tickSpacing: 1 },    // 0.01%
  LOW: { fee: 500, tickSpacing: 10 },      // 0.05%
  MEDIUM: { fee: 3000, tickSpacing: 60 },  // 0.3%
  HIGH: { fee: 10000, tickSpacing: 200 }   // 1%
};

// Define the price result interface
export interface TokenPriceResult {
  loading: boolean;
  error: Error | null;
  priceInUsdc: number | null;
  priceUsdcInToken: number | null;
  liquidityAvailable: boolean;
}

// Type definition for pool state
interface PoolState {
  sqrtPriceX96: bigint;
  tick: number;
  protocolFee: number;
  hookFees: [number, number, number, number];
}

/**
 * Custom hook to fetch the price of a token against USDC using Uniswap V4
 * 
 * @param tokenAddress The address of the token to get price for
 * @param tokenDecimals The number of decimals for the token (defaults to 18)
 * @returns TokenPriceResult with price information and status
 */
export function useUniswapV4Price(
  tokenAddress: string,
  tokenDecimals: number = 18
): TokenPriceResult {
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  
  const [result, setResult] = useState<TokenPriceResult>({
    loading: false,
    error: null,
    priceInUsdc: null,
    priceUsdcInToken: null,
    liquidityAvailable: false
  });

  // Create Token instances
  const tokenUSDC = useMemo(() => {
    if (!chainId || !USDC_ADDRESS[chainId]) return null;
    return new Token(
      chainId,
      USDC_ADDRESS[chainId],
      6, // USDC has 6 decimals
      'USDC',
      'USD Coin'
    );
  }, [chainId]);

  const token = useMemo(() => {
    if (!chainId || !tokenAddress) return null;
    try {
      const formattedAddress = getAddress(tokenAddress);
      return new Token(
        chainId,
        formattedAddress,
        tokenDecimals,
        '', // Symbol not needed for price calculation
        ''  // Name not needed for price calculation
      );
    } catch (error) {
      console.error('Invalid token address', error);
      return null;
    }
  }, [chainId, tokenAddress, tokenDecimals]);

  // Fetch token price
  useEffect(() => {
    if (!isConnected || !publicClient || !tokenUSDC || !token || !chainId || !POOL_MANAGER_ADDRESS[chainId]) {
      return;
    }

    const fetchPrice = async () => {
      setResult(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        // Try to find a pool with liquidity
        let pool = null;
        let liquidity = BigInt(0);

        // Find a pool with the most liquidity
        for (const { fee, tickSpacing } of [
          // FEE_TIERS.LOWEST,
          // FEE_TIERS.LOW, 
          FEE_TIERS.MEDIUM, 
          // FEE_TIERS.HIGH
        ]) {
          try {
            // Token ordering matters in V4, so normalize by address
            const [token0, token1] = token.address.toLowerCase() < tokenUSDC.address.toLowerCase()
              ? [token, tokenUSDC]
              : [tokenUSDC, token];
            
            // Use Pool.getPoolKey() with the correct tickSpacing for this fee tier
            const poolKey = Pool.getPoolKey(
              token0,
              token1,
              fee,
              tickSpacing, // Use the appropriate tick spacing for this fee tier
              EMPTY_HOOK // No hooks
            );

            // Get the pool state using poolKey directly
            const poolState = await publicClient.readContract({
              address: POOL_MANAGER_ADDRESS[chainId],
              abi: UNISWAP_V4_POOL_MANAGER_ABI,
              functionName: 'getSlot0',
              args: [poolKey]
            }) as unknown as PoolState;

            console.log("poolState", poolState);

            if (poolState) {
              const currentLiquidity = await publicClient.readContract({
                address: POOL_MANAGER_ADDRESS[chainId],
                abi: UNISWAP_V4_POOL_MANAGER_ABI,
                functionName: 'getLiquidity',
                args: [poolState]
              }) as bigint;

              if (currentLiquidity > liquidity) {
                liquidity = currentLiquidity;
                
                // Create a simplified V4 Pool representation 
                // (we're only using this for price calculation)
                const sqrtPriceX96 = poolState.sqrtPriceX96;
                const tick = poolState.tick;
                
                // Calculate the price based on sqrtPriceX96
                // sqrtPriceX96 is sqrt(price) * 2^96
                const sqrtPrice = Number(sqrtPriceX96) / 2**96;
                const price = sqrtPrice * sqrtPrice;
                
                // Price is token1/token0, so we need to check token ordering
                let priceInUsdc, priceUsdcInToken;
                
                if (token0.address === token.address) {
                  // If token is token0, then price is USDC/token
                  priceUsdcInToken = price.toString();
                  priceInUsdc = (1 / price).toString();
                } else {
                  // If token is token1, then price is token/USDC
                  priceInUsdc = price.toString();
                  priceUsdcInToken = (1 / price).toString();
                }
                
                setResult({
                  loading: false,
                  error: null,
                  priceInUsdc: parseFloat(priceInUsdc),
                  priceUsdcInToken: parseFloat(priceUsdcInToken),
                  liquidityAvailable: true
                });
                
                // Found a pool with liquidity, no need to check others
                return;
              }
            }
          } catch (error) {
            // Continue trying other fee tiers if this one fails
            console.warn(`No pool found for fee tier ${fee}`);
          }
        }

        // If we get here, no pool with liquidity was found
        setResult({
          loading: false,
          error: new Error('No liquidity available for this token pair'),
          priceInUsdc: null,
          priceUsdcInToken: null,
          liquidityAvailable: false
        });
      } catch (error) {
        console.error('Error fetching token price:', error);
        setResult({
          loading: false,
          error: error instanceof Error ? error : new Error('Failed to fetch price'),
          priceInUsdc: null,
          priceUsdcInToken: null,
          liquidityAvailable: false
        });
      }
    };

    fetchPrice();
  }, [chainId, isConnected, publicClient, token, tokenUSDC]);

  return result;
}

/**
 * Helper hook to get prices for all tokens in a list
 * 
 * @param tokens List of TokenInfo objects
 * @returns Record of token addresses to price results
 */
export function useTokenPrices(tokens: TokenInfo[]): Record<string, TokenPriceResult> {
  const { chainId } = useAccount();

  // Create a map to store price results for each token
  const [tokenPrices, setTokenPrices] = useState<Record<string, TokenPriceResult>>({});

  // Initialize with loading state for each token
  useEffect(() => {
    if (!tokens.length) return;

    // Initialize price state for each token
    const initialPrices: Record<string, TokenPriceResult> = {};
    tokens.forEach(token => {
      initialPrices[token.address] = {
        loading: true,
        error: null,
        priceInUsdc: null,
        priceUsdcInToken: null,
        liquidityAvailable: false
      };
    });
    
    setTokenPrices(initialPrices);
  }, [tokens]);

  // Fetch price for each token individually
  useEffect(() => {
    if (!chainId || !tokens.length) return;

    const fetchPrices = async () => {
      // Process tokens in sequence to avoid rate limits
      for (const token of tokens) {
        try {
          // Mark this token as in progress
          setTokenPrices(prev => ({
            ...prev,
            [token.address]: {
              ...prev[token.address],
              loading: true
            }
          }));
          
          // Attempt to fetch from Uniswap
          // Note: Since we can't directly use hooks inside callbacks,
          // we're reimplementing the price fetch logic here
          // In a real app, you might want to create a separate function for this logic
          // or use a more sophisticated state management solution
          
          // This would be the implementation, but for simplicity 
          // marking tokens without priceUsd as having no price available
          setTokenPrices(prev => ({
            ...prev,
            [token.address]: {
              loading: false,
              error: new Error('Token has no predefined price and dynamic pricing is not implemented in this batch function'),
              priceInUsdc: null,
              priceUsdcInToken: null,
              liquidityAvailable: false
            }
          }));
        } catch (error) {
          console.error(`Error fetching price for token ${token.symbol}:`, error);
          setTokenPrices(prev => ({
            ...prev,
            [token.address]: {
              loading: false,
              error: error instanceof Error ? error : new Error('Failed to fetch price'),
              priceInUsdc: null,
              priceUsdcInToken: null,
              liquidityAvailable: false
            }
          }));
        }
      }
    };

    fetchPrices();
  }, [chainId, tokens]);

  return tokenPrices;
}

/**
 * Hook to convert token amount to USDC value
 * 
 * @param tokenAddress Address of the token
 * @param amount Amount of tokens (in token units)
 * @returns The value in USDC or null if price is not available
 */
export function useTokenToUsdcValue(
  tokenAddress: string,
  amount: number
): { loading: boolean; usdcValue: number | null; error: Error | null } {
  const { priceInUsdc, loading, error } = useUniswapV4Price(tokenAddress);
  
  const usdcValue = useMemo(() => {
    if (!priceInUsdc) return null;
    return amount * priceInUsdc;
  }, [amount, priceInUsdc]);
  
  return { loading, usdcValue, error };
} 