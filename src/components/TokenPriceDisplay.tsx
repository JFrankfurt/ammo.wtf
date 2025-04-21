import { TokenInfo } from "@/addresses";
import { useUniswapV4Slot0 } from "@/hooks";
import { formatCurrency } from "@/utils/formatCurrency";
import { sqrtPriceX96ToTokenPrices } from "@/utils/sqrtPricex96ToPrice";
import { cn } from "@/utils/cn";

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
      <span className="text-muted text-xs">Price:</span>
      {isLoading ? (
        <span className="text-muted/70 text-xs animate-pulse">Loading...</span>
      ) : sqrtPriceX96 && price0 ? (
        <span className="font-mono text-xs text-accentGreen">
          {formatCurrency(price0)}
        </span>
      ) : (
        <span className="text-muted/70 text-xs">N/A</span>
      )}
    </div>
  );
};

// This component displays token prices from Uniswap V4 pools.
// It fetches the sqrtPriceX96 value and converts it to human-readable prices.
// The UI is designed to match the parent TokenBalanceSummary component's style
// while providing clear feedback about the loading and error states.

/*
TokenPriceDisplay Refactoring:
1. Changed text colors to use theme variables:
   - Regular text to 'text-muted'
   - Loading/unavailable states to 'text-muted/70' (slightly dimmer)
   - Prices to 'text-accentGreen' to emphasize their importance
2. Applied 'font-mono' to price display to match the tech/hacker aesthetic
3. Made text slightly smaller with 'text-xs' for a more dense, data-rich feel
4. Simplified "Not available" to "N/A" for a more technical, concise display
*/
