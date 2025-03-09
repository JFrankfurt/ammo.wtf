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
        <div className="flex justify-center py-3 md:py-4">
          <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : selectedTokens.length === 0 ? (
        <div className="text-center py-3 md:py-4 text-sm md:text-base text-gray-500">
          You don&apos;t have any ammunition tokens to ship.
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {selectedTokens.map((token) => (
            <div
              key={token.address}
              className="p-2 md:p-3 border rounded-lg bg-gray-50"
            >
              <div className="flex justify-between items-center mb-1 md:mb-2">
                <div className="font-medium text-sm md:text-base truncate pr-2">
                  {token.name}
                </div>
                <div className="text-xs md:text-sm text-gray-500">
                  Balance: {tokenBalances[token.address]?.toFixed(2) || "0"}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max={Math.floor((tokenBalances[token.address] || 0) / 250)}
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
                    max={Math.floor((tokenBalances[token.address] || 0) / 250)}
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

              <div className="mt-1 md:mt-2 text-xs md:text-sm text-gray-600">
                <span className="font-medium">
                  {(quantities[token.address] || 0) * 250} rounds
                </span>{" "}
                selected
                {token.priceUsd && (
                  <span className="ml-1 text-gray-500">
                    ($
                    {(
                      (quantities[token.address] || 0) *
                      250 *
                      token.priceUsd
                    ).toFixed(2)}
                    )
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Order Summary */}
          <div className="mt-4 pt-3 md:pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center mb-1 md:mb-2">
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
          <div className="mt-4 md:mt-6">
            <Button
              onClick={onContinue}
              disabled={!hasSelectedQuantities}
              className="w-full"
            >
              Continue to Shipping
            </Button>
            <div className="mt-2 text-xs md:text-sm text-center text-gray-500">
              You will need to confirm a transaction to complete shipping.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
