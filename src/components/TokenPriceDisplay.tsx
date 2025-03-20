import { TokenInfo } from "../addresses";
import { useUniswapV4Slot0 } from "@/src/hooks";
import { sqrtPriceX96ToTokenPrices } from "../utils/sqrtPricex96ToPrice";
import { formatCurrency } from "../utils/formatCurrency";

interface TokenPriceDisplayProps {
  token: TokenInfo;
}

export const TokenPriceDisplay = ({ token }: TokenPriceDisplayProps) => {
  const { data, isLoading } = useUniswapV4Slot0(token.address);
  const sqrtPriceX96 = data?.[0];

  // Calculate token prices when sqrtPriceX96 is available
  // Default decimals: 6 for token0 (typically USDC), 18 for token1 (typically the token)
  const [price0, price1] = sqrtPriceX96
    ? sqrtPriceX96ToTokenPrices(sqrtPriceX96, 6, 18)
    : [null, null];

  // Render different UI states based on data availability
  return (
    <div className="flex flex-row gap-1 md:gap-2 items-center">
      <span className="text-gray-500 dark:text-gray-400 text-sm">Price:</span>
      {isLoading ? (
        <span className="text-gray-400 text-sm animate-pulse">Loading...</span>
      ) : sqrtPriceX96 && price0 ? (
        <span className="font-medium">{formatCurrency(price0)}</span>
      ) : (
        <span className="text-gray-400 text-sm">Not available</span>
      )}
    </div>
  );
};

// This component displays token prices from Uniswap V4 pools.
// It fetches the sqrtPriceX96 value and converts it to human-readable prices.
// The UI is designed to match the parent TokenBalanceSummary component's style
// while providing clear feedback about the loading and error states.
