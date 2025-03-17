import { useMemo } from "react";
import { Button } from "./Button";
import { TokenInfo } from "../addresses";

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
          <div className="animate-spin rounded-full h-8 w-8 md:h-10 md:w-10 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading your tokens...</span>
        </div>
      ) : selectedTokens.length === 0 ? (
        <div className="text-center py-8 md:py-12 px-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 12H4M8 16l-4-4 4-4M16 16l4-4-4-4"
            />
          </svg>
          <h3 className="mt-2 text-base font-medium text-gray-900">
            No Ammunition Tokens
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            You don&apos;t have any ammunition tokens to ship.
          </p>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          <div className="mb-2 text-sm font-medium text-gray-700">
            Select the quantity of each token to ship:
          </div>

          <div className="max-h-[50vh] overflow-y-auto pr-1 space-y-3 md:space-y-4">
            {selectedTokens.map((token) => (
              <div
                key={token.address}
                className="p-3 md:p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-center mb-2 md:mb-3">
                  <div className="font-medium text-sm md:text-base truncate pr-2">
                    {token.name}
                  </div>
                  <div className="text-xs md:text-sm text-gray-500">
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
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
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
                      className="w-full px-2 py-1 text-xs md:text-sm border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="mt-2 md:mt-3 text-xs md:text-sm text-gray-600">
                  <span className="font-medium">
                    {(quantities[token.address] || 0) * 250} rounds
                  </span>{" "}
                  selected
                  <span className="ml-1 text-gray-500">
                    ($
                    {((quantities[token.address] || 0) * 250 * 10.0).toFixed(2)}
                    )
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm md:text-base font-medium">
                Total Rounds:
              </div>
              <div className="text-sm md:text-base font-bold">
                {totalTokens}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm md:text-base font-medium">
                Estimated Value:
              </div>
              <div className="text-sm md:text-base font-bold">
                ${totalValueUsd.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6">
            <Button
              onClick={onContinue}
              disabled={!hasSelectedQuantities}
              className="w-full py-2.5"
            >
              Continue to Shipping
            </Button>
            <div className="mt-3 text-xs md:text-sm text-center text-gray-500 flex items-center justify-center">
              <svg
                className="h-4 w-4 mr-1 text-gray-400"
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
