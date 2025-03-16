import Image from "next/image";
import { TokenInfo } from "../addresses";
import { useUniswapV4Price } from "../hooks";

interface TokenPriceDisplayProps {
  token: TokenInfo;
}

export const TokenPriceDisplay = ({ token }: TokenPriceDisplayProps) => {
  const { data, error, isLoading } = useUniswapV4Price(token.address);
  console.log("jf slot0", data);
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
      <span>{"formattedPrice"}</span>
    </div>
  );
};
