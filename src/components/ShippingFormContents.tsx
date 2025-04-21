import { useMemo } from "react";
import { Button } from "./Button";
import { TokenInfo } from "../addresses";
import { cn } from "../utils/cn";

interface ShippingFormContentsProps {
  selectedTokens: TokenInfo[];
  quantities: Record<string, number>;
  handleQuantityChange: (address: string, value: number) => void;
  totalTokens: number;
  totalValueUsd: number;
  hasSelectedQuantities: boolean;
  onContinue: () => void;
  balancesLoading: boolean;
  tokenBalances: Record<string, number>;
}

export const ShippingFormContents = ({
  selectedTokens,
  quantities,
  handleQuantityChange,
  totalTokens,
  totalValueUsd,
  hasSelectedQuantities,
  onContinue,
  balancesLoading,
  tokenBalances,
}: ShippingFormContentsProps) => {
  return (
    <div className="space-y-4 md:space-y-6">
      {balancesLoading ? (
        <div className="flex justify-center items-center py-8 md:py-12">
          <div className="animate-spin rounded-full h-8 w-8 md:h-10 md:w-10 border-b-2 border-accentGreen"></div>
          <span className="ml-3 text-muted font-mono">
            Loading your tokens...
          </span>
        </div>
      ) : selectedTokens.length === 0 ? (
        <div className="text-center py-8 md:py-12 px-4">
          <svg
            className="mx-auto h-12 w-12 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM8.25 9.75h7.5v4.5h-7.5z"
            />
          </svg>
          <h3 className="mt-2 font-medium text-foreground font-mono">
            No Ammunition Tokens
          </h3>
          <p className="mt-1 text-muted font-mono">
            You don&apos;t have any ammunition tokens to ship.
          </p>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          <div className="mb-2 font-medium text-muted">
            Select the quantity of each token to ship:
          </div>

          <div className="max-h-[50vh] overflow-y-auto pr-1 space-y-3 md:space-y-4">
            {selectedTokens.map((token) => (
              <div
                key={token.address}
                className="p-3 md:p-4 border border-border rounded-none bg-muted/10 hover:bg-muted/20 transition-colors"
              >
                <div className="flex justify-between items-center mb-2 md:mb-3">
                  <div className="font-medium text-foreground font-mono truncate pr-2">
                    {token.name}
                  </div>
                  <div className="text-muted font-mono">
                    Balance: {tokenBalances[token.address]?.toFixed(2) || "0"}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <input
                      type="range"
                      min="0"
                      max={Math.floor(
                        (tokenBalances[token.address] || 0) / 250
                      )}
                      step="1"
                      value={quantities[token.address] || 0}
                      onChange={(e) =>
                        handleQuantityChange(
                          token.address,
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full h-1.5 bg-border rounded-full appearance-none cursor-pointer accent-accentGreen"
                    />
                  </div>
                  <div className="w-16 md:w-20">
                    <input
                      type="number"
                      min="0"
                      max={Math.floor(
                        (tokenBalances[token.address] || 0) / 250
                      )}
                      value={quantities[token.address] || 0}
                      onChange={(e) =>
                        handleQuantityChange(
                          token.address,
                          parseInt(e.target.value)
                        )
                      }
                      className={cn(
                        "w-full",
                        "h-8 px-2 py-1",
                        "text-xs font-mono",
                        "border border-border",
                        "rounded-none",
                        "bg-input",
                        "text-foreground",
                        "placeholder:text-muted",
                        "focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
                      )}
                    />
                  </div>
                </div>

                <div className="mt-2 md:mt-3 text-xs text-muted">
                  <span className="font-medium font-mono">
                    {(quantities[token.address] || 0) * 250} rounds
                  </span>{" "}
                  selected
                  <span className="ml-1 font-mono text-muted/80">
                    (~$
                    {((quantities[token.address] || 0) * 250 * 0.3).toFixed(2)})
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="mt-4 pt-4 border-t border-border text-xs">
            <div className="flex justify-between items-center mb-1">
              <div className="font-medium text-muted font-mono">
                Total Rounds:
              </div>
              <div className="font-bold text-accentGreen font-mono">
                {totalTokens}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="font-medium text-muted font-mono">
                Est. Value (USD):
              </div>
              <div className="font-bold text-accentGreen font-mono">
                ${totalValueUsd.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6">
            <Button
              onClick={onContinue}
              disabled={!hasSelectedQuantities}
              className="w-full"
            >
              Continue to Shipping
            </Button>
            <div className="mt-3 text-center text-xs text-muted flex items-center justify-center font-mono">
              <svg
                className="h-4 w-4 mr-1 text-muted flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              You will need to confirm a transaction to complete shipping.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
