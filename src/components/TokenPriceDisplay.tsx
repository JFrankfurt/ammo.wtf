import { TokenInfo } from "../addresses";

interface TokenPriceDisplayProps {
  token: TokenInfo;
}

export const TokenPriceDisplay = ({ token }: TokenPriceDisplayProps) => {
  // priceUsd is no longer supported, using fixed price
  // No longer fetching price from Uniswap

  return (
    <div className="flex flex-row gap-1 md:gap-2 items-center">
      <span className="text-gray-500 dark:text-gray-400 text-sm">Price:</span>
      <span>$10.00</span>
    </div>
  );
};
