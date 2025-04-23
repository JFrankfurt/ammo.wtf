import { useEffect, useMemo } from 'react';
import { useUniswapSwap } from './useUniswapSwap'; // Assuming this is the correct path
import { USDC_ADDRESS } from '../addresses'; // Assuming this is the correct path
import { logger } from '../utils/logger'; // Assuming a logger utility exists

// Type definition for the state returned by useUniswapSwap
// Adjust this based on the actual return type of useUniswapSwap
interface UniswapSwapState {
    quote: { outputAmount: string } | null;
    txHash: string | null;
    error: Error | null;
    loading: boolean; // Assuming loading covers both quote fetching and swapping
}

interface UsePurchaseSwapArgs {
    amountUSDC: string; // The raw input amount string
    totalCostUSDC: string; // The calculated total cost string to be swapped
    parsedAmountUSDC: number; // The parsed numeric value of amountUSDC
    tokenOutAddress: string;
    slippagePercentage: number;
    chainId: number;
    onSuccess?: (txHash: string) => void;
    onError?: (error: Error) => void;
    // This hook is only active when amount > 0 and required addresses are present
    enabled: boolean;
}

interface UsePurchaseSwapResult {
    swapState: UniswapSwapState;
    executeSwap: () => Promise<void>;
}

/**
 * Manages the Uniswap swap process specifically for purchasing a token with USDC.
 * Handles fetching quotes based on user input amount and executing the swap with the total cost.
 * Propagates success and error states via callbacks.
 */
export function usePurchaseSwap({
    amountUSDC,
    totalCostUSDC,
    parsedAmountUSDC, // Used to decide if a quote is needed
    tokenOutAddress,
    slippagePercentage,
    chainId,
    onSuccess,
    onError,
    enabled // Combined check for amount > 0 and addresses validity
}: UsePurchaseSwapArgs): UsePurchaseSwapResult {
    // Initial log with received props
    logger.debug('usePurchaseSwap initialized', {
        amountUSDC,
        totalCostUSDC,
        parsedAmountUSDC,
        tokenOutAddress,
        slippagePercentage,
        chainId,
        enabled
    });

    // Underlying Uniswap hook
    const { state: swapState, getQuote, swap } = useUniswapSwap(chainId);
    logger.debug('useUniswapSwap hook initialized', { chainId });

    // Memoize the USDC address for the current chain
    const usdcAddress = useMemo(() => {
        const addr = USDC_ADDRESS[chainId] || '';
        logger.debug('Memoized usdcAddress', { chainId, usdcAddress: addr });
        return addr;
    }, [chainId]);

    // Effect to fetch a quote whenever the input amount or other dependencies change,
    // but only if the hook is 'enabled' (valid amount, addresses known).
    useEffect(() => {
        logger.debug('Quote fetch effect triggered', {
            enabled,
            usdcAddress,
            tokenOutAddress,
            parsedAmountUSDC
        });

        // Ensure we are enabled and have necessary parameters before fetching
        if (!enabled || !usdcAddress || !tokenOutAddress || parsedAmountUSDC <= 0) {
             logger.debug('Quote fetch skipped: Conditions not met.');
             // Optionally clear the previous quote if dependencies change and it's no longer valid?
             // This depends on the desired behavior of useUniswapSwap's state.
            return;
        }

        const fetchQuote = async () => {
            logger.debug('Attempting to fetch quote...');
            try {
                logger.debug(`Fetching quote: ${amountUSDC} USDC (${usdcAddress}) for ${tokenOutAddress}`, {
                    amount: amountUSDC,
                    slippagePercentage
                });
                // Get quote based on the *user input amount* (subtotal)
                await getQuote({
                    tokenIn: usdcAddress,
                    tokenOut: tokenOutAddress,
                    amount: amountUSDC, // Use the raw input amount for the quote request
                    slippagePercentage,
                });
                logger.debug('Quote fetch successful (underlying hook will update state).');
            } catch (err) {
                logger.error("Error getting quote in usePurchaseSwap:", err);
                // Propagate error if callback is provided
                if (onError && err instanceof Error) {
                     logger.debug('Propagating quote fetch error via onError callback.');
                     onError(err);
                } else if (err instanceof Error) {
                    logger.debug('Quote fetch error occurred, but no onError callback provided.');
                    // If no onError provided, maybe update local state if the hook exposes it?
                    // Currently relies on useUniswapSwap's state.error
                } else {
                    logger.error('Caught non-Error object during quote fetch:', err);
                }
            }
        };

        fetchQuote();
    // Dependencies: Only refetch if these specific values change.
    // Note: getQuote function reference might change, include it if necessary.
    }, [enabled, amountUSDC, parsedAmountUSDC, usdcAddress, tokenOutAddress, slippagePercentage, getQuote, onError]);

    // Effect to propagate transaction success via the onSuccess callback
    useEffect(() => {
        logger.debug('Success propagation effect triggered', { txHash: swapState.txHash });
        if (swapState.txHash && onSuccess) {
            logger.debug('Calling onSuccess callback with txHash:', swapState.txHash);
            onSuccess(swapState.txHash);
        } else if (swapState.txHash) {
             logger.debug('Transaction successful (txHash present), but no onSuccess callback provided.');
        }
    }, [swapState.txHash, onSuccess]);

    // Effect to propagate transaction errors via the onError callback
    // This might be redundant if the fetchQuote effect already calls onError for swap errors,
    // depending on how useUniswapSwap manages its state.error. If state.error covers
    // both quote and swap errors, this is fine.
    useEffect(() => {
         logger.debug('Error propagation effect triggered', { error: swapState.error });
         if (swapState.error && onError) {
             // Avoid double-calling if fetchQuote already handled it?
             // This depends on the specifics of useUniswapSwap state updates.
             // Assuming state.error is set distinctly for swap vs quote errors.
             logger.debug('Calling onError callback with swapState error:', swapState.error);
             onError(swapState.error);
         } else if (swapState.error) {
             logger.debug('Swap error occurred (swapState.error present), but no onError callback provided.');
         }
    }, [swapState.error, onError]);


    // Function to initiate the swap transaction
    const executeSwap = async () => {
        logger.debug('executeSwap called');
        const parsedTotalCost = parseFloat(totalCostUSDC);
        // Double-check conditions before executing swap
        if (!enabled || !usdcAddress || !tokenOutAddress || parsedAmountUSDC <= 0 || parsedTotalCost <=0 ) {
             logger.warn("Swap execution skipped: Conditions not met.", {
                 enabled,
                 usdcAddress,
                 tokenOutAddress,
                 parsedAmountUSDC,
                 totalCostUSDC,
                 parsedTotalCost
             });
            return;
        }

        logger.debug('Attempting to execute swap...');
        try {
            logger.debug(`Executing swap: ${totalCostUSDC} USDC (${usdcAddress}) for ${tokenOutAddress}`, {
                amount: totalCostUSDC,
                slippagePercentage
            });
            // Execute swap using the *total calculated cost*
            await swap({
                tokenIn: usdcAddress,
                tokenOut: tokenOutAddress,
                amount: totalCostUSDC, // Swap the total cost (amount + fees)
                slippagePercentage,
            });
            // Success is handled by the useEffect watching swapState.txHash
            logger.debug('Swap execution successful (underlying hook will update state).');
        } catch (err) {
            logger.error("Error executing swap in usePurchaseSwap:", err);
            // Error is handled by the useEffect watching swapState.error (or potentially here if onError exists)
             if (onError && err instanceof Error && !swapState.error) {
                // If useUniswapSwap doesn't set state.error on swap() rejection but throws, call onError here.
                 logger.debug('Propagating swap execution error via onError callback.');
                 onError(err);
            } else if (err instanceof Error) {
                 logger.debug('Swap execution error occurred, but no onError callback provided or error already in swapState.');
            } else {
                 logger.error('Caught non-Error object during swap execution:', err);
            }
        }
    };

    // Return the underlying swap state and the function to trigger the swap
    logger.debug('Returning swapState and executeSwap', { swapState });
    return {
        swapState,
        executeSwap,
    };
} 