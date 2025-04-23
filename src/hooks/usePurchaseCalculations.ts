import { useMemo } from 'react';

interface PurchaseCalculationsArgs {
  amount: string;
  shippingFeePercentage: number;
}

interface PurchaseCalculationsResult {
  shippingFee: string;
  totalCost: string;
  subtotal: string;
  parsedAmount: number; // Also expose the parsed number for convenience
}

/**
 * Calculates subtotal, shipping fee, and total cost based on an input amount string
 * and a shipping fee percentage.
 * Ensures calculations handle non-numeric or zero inputs gracefully.
 */
export function usePurchaseCalculations({
  amount,
  shippingFeePercentage,
}: PurchaseCalculationsArgs): PurchaseCalculationsResult {
  // Memoize the parsed amount to avoid recalculating on every render
  const parsedAmount = useMemo(() => {
    const num = parseFloat(amount);
    // Treat invalid or non-positive numbers as zero
    return !isNaN(num) && num > 0 ? num : 0;
  }, [amount]);

  // Memoize the shipping fee calculation
  const shippingFee = useMemo(() => {
    if (parsedAmount === 0) return '0.00';
    // Calculate and format to two decimal places
    return ((parsedAmount * shippingFeePercentage) / 100).toFixed(2);
  }, [parsedAmount, shippingFeePercentage]);

  // Memoize the total cost calculation
  const totalCost = useMemo(() => {
    if (parsedAmount === 0) return '0.00';
    // Add the parsed amount and the *parsed* shipping fee before formatting
    return (parsedAmount + parseFloat(shippingFee)).toFixed(2);
  }, [parsedAmount, shippingFee]);

  // Memoize the subtotal formatting
  const subtotal = useMemo(() => {
     return parsedAmount > 0 ? parsedAmount.toFixed(2) : '0.00';
  }, [parsedAmount])

  return { shippingFee, totalCost, subtotal, parsedAmount };
} 