import { useMemo } from "react";
import { useUniswapV4Price, useTokenToUsdcValue } from "../hooks";
import { TokenInfo } from "../addresses";
import Image from "next/image";

interface TokenPriceDisplayProps {
  token: TokenInfo;
  amount?: number;
}

/**
 * Component that displays the price of a token in USDC and the value of a specified amount
 */
export const TokenPriceDisplay = ({
  token,
  amount = 1,
}: TokenPriceDisplayProps) => {
  // Get price information for the token
  const { priceInUsdc, priceUsdcInToken, loading, error, liquidityAvailable } =
    useUniswapV4Price(token.address);
  console.log("priceInUsdc", priceInUsdc);
  console.log("priceUsdcInToken", priceUsdcInToken);
  console.log("loading", loading);
  console.log("error", error?.message);
  console.log("liquidityAvailable", liquidityAvailable);
  // Get the value of a specified amount in USDC
  const { usdcValue } = useTokenToUsdcValue(token.address, amount);

  console.log("usdcValue", usdcValue);

  // Format price with appropriate precision
  const formattedPrice = useMemo(() => {
    if (!priceInUsdc) return "N/A";
    // Use more decimal places for low-value tokens
    return priceInUsdc < 0.01
      ? `$${priceInUsdc.toFixed(6)}`
      : priceInUsdc < 1
      ? `$${priceInUsdc.toFixed(4)}`
      : `$${priceInUsdc.toFixed(2)}`;
  }, [priceInUsdc]);

  // Format the total value
  const formattedValue = useMemo(() => {
    if (!usdcValue) return "N/A";
    return `$${usdcValue.toFixed(2)}`;
  }, [usdcValue]);

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium">{token.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {token.symbol}
          </p>
        </div>
        {token.icon && (
          <div className="h-10 w-10 rounded-full overflow-hidden">
            <Image
              src={token.icon}
              alt={token.symbol}
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
      ) : error ? (
        <div className="text-red-500 text-sm">$xx.xx</div>
      ) : (
        <>
          <div className="mb-2">
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              Price:
            </span>
            <span className="ml-2 font-semibold">{formattedPrice}</span>
            {token.priceUsd !== undefined && priceInUsdc && (
              <span className="ml-2 text-xs">
                {Math.abs(token.priceUsd - priceInUsdc) < 0.001
                  ? "(Fixed Price)"
                  : `(${((priceInUsdc / token.priceUsd - 1) * 100).toFixed(
                      2
                    )}% vs. Fixed)`}
              </span>
            )}
          </div>

          {amount > 1 && (
            <div className="mb-2">
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                Value of {amount} {token.symbol}:
              </span>
              <span className="ml-2 font-semibold">{formattedValue}</span>
            </div>
          )}

          {!liquidityAvailable && !token.priceUsd && (
            <div className="text-yellow-500 text-xs mt-2">$--.--</div>
          )}
        </>
      )}

      {token.description && (
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          {token.description}
        </div>
      )}
    </div>
  );
};
