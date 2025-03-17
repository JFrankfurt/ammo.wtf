import { TokenInfo } from "../addresses";
import { useUniswapV4Price } from "../hooks";

interface TokenPriceDisplayProps {
  token: TokenInfo;
}

export const TokenPriceDisplay = ({ token }: TokenPriceDisplayProps) => {
  const { data, error, isLoading } = useUniswapV4Price(token.address);
  const [sqrtPriceX96, tick, protocolFee, lpFee] = data ?? [];
  console.log("jf sqrtPriceX96", sqrtPriceX96); // native JS bignumber

  const formatPrice = (sqrtPriceX96: string) => {
    if (!sqrtPriceX96) return null;

    const sqrtPriceX96BN = BigInt(sqrtPriceX96);
    const sqrtPriceSquared = sqrtPriceX96BN * sqrtPriceX96BN;
    const priceFixedPoint = sqrtPriceSquared >> BigInt(192);
    return Number(priceFixedPoint) / 10 ** 18;
  };

  const formattedPrice = formatPrice(sqrtPriceX96);
  console.log("jf formattedPrice", formattedPrice);

  if (isLoading) {
    return (
      <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1"></div>
    );
  }
  if (error) {
    return <div className="text-red-500 text-sm">$xx.xx</div>;
  }

  return (
    <div className="flex flex-row gap-1 md:gap-2 items-center">
      <span className="text-gray-500 dark:text-gray-400 text-sm">Price:</span>
      <span>${formattedPrice?.toFixed(2) ?? "xx.xx"}</span>
    </div>
  );
};
