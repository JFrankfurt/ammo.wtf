import React from "react";

interface OrderSummaryProps {
  subtotal: string;
  shippingFee: string;
  totalCost: string;
  shippingFeePercentage: number;
  estimatedOutputAmount?: string; // Optional: display estimated token output
  outputTokenSymbol?: string; // Optional: symbol for the output token
  currencySymbol?: string; // e.g., "USDC"
}

/**
 * Displays a breakdown of costs including subtotal, shipping/fees, and total.
 * Optionally shows the estimated amount of the output token to be received.
 */
export const OrderSummary: React.FC<OrderSummaryProps> = ({
  subtotal,
  shippingFee,
  totalCost,
  shippingFeePercentage,
  estimatedOutputAmount,
  outputTokenSymbol,
  currencySymbol = "USDC", // Default to USDC if not provided
}) => {
  // Determine if the amounts are valid numbers greater than zero for display logic
  const hasSubtotal = parseFloat(subtotal) > 0;

  return (
    <div className="border border-border">
      {/* Header */}
      <div className="bg-muted/10 px-3 py-1.5 border-b border-border">
        <h3 className="font-medium text-xs font-mono text-foreground">
          Order Summary
        </h3>
      </div>

      {/* Body with cost breakdown */}
      <div className="p-2.5 space-y-1.5 text-xs">
        {/* Subtotal */}
        <div className="flex justify-between">
          <span className="text-muted">Subtotal</span>
          <span className="font-mono font-medium text-foreground">
            {hasSubtotal ? subtotal : "0.00"} {currencySymbol}
          </span>
        </div>

        {/* Shipping Fee */}
        <div className="flex justify-between">
          <span className="text-muted">
            Shipping ({shippingFeePercentage}%)
          </span>
          <span className="font-mono font-medium text-foreground">
            {hasSubtotal ? shippingFee : "0.00"} {currencySymbol}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-border my-1 pt-1"></div>

        {/* Total Cost */}
        <div className="flex justify-between">
          <span className="font-medium font-mono text-foreground">Total</span>
          <span className="font-bold font-mono text-foreground">
            {hasSubtotal ? totalCost : "0.00"} {currencySymbol}
          </span>
        </div>

        {/* Estimated Output (Optional) */}
        {estimatedOutputAmount && outputTokenSymbol && hasSubtotal && (
          <div className="flex justify-between pt-1 border-t border-border">
            <span className="text-muted">You receive (est.)</span>
            <span className="font-mono font-medium text-accentGreen">
              {estimatedOutputAmount} {outputTokenSymbol}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
