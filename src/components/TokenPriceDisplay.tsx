import { TokenInfo } from "@/addresses";
import { useUniswapV4Slot0 } from "@/hooks";
import { formatCurrency } from "@/utils/formatCurrency";
import { sqrtPriceX96ToTokenPrices } from "@/utils/sqrtPricex96ToPrice";

interface TokenPriceDisplayProps {
  token: TokenInfo;
}

export const TokenPriceDisplay = ({ token }: TokenPriceDisplayProps) => {
  const { data, isLoading } = useUniswapV4Slot0(token.address);
  const sqrtPriceX96 = data?.[0];

  const [price0] = sqrtPriceX96
    ? sqrtPriceX96ToTokenPrices(sqrtPriceX96, 6, 18)
    : [null];

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
