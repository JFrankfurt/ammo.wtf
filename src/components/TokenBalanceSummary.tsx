import Image from "next/image";
import { useAccount } from "wagmi";
import { useState, useMemo } from "react";
import { getTokensForChain, type TokenInfo } from "../addresses";
import { useTokenBalances } from "../hooks/useTokenBalances";
import { TokenPriceDisplay } from "./TokenPriceDisplay";
import { TokenPropertyChip } from "./TokenPropertyChip";
import { fallbackChainId } from "../utils/chains";
import { useDebounceValue } from "usehooks-ts";

interface TokenBalanceSummaryProps {
  onTokenAction: (token: TokenInfo, action: "ship" | "purchase") => void;
}

type SortOption = "name" | "quantity" | "value";

export const TokenBalanceSummary = ({
  onTokenAction,
}: TokenBalanceSummaryProps) => {
  const { chainId, address } = useAccount();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounceValue(searchTerm, 500);
  const [sortBy, setSortBy] = useState<SortOption>("name");

  // Get all tokens for the current chain
  const tokens = useMemo(
    () => getTokensForChain(chainId ?? fallbackChainId),
    [chainId]
  );

  // Get token balances
  const { balances, isLoading } = useTokenBalances(
    tokens,
    address as `0x${string}`
  );

  // Filter tokens based on debounced search term
  const filteredTokens = useMemo(() => {
    if (!debouncedSearchTerm) return tokens;
    const term = debouncedSearchTerm.toLowerCase().trim();
    return tokens.filter((token) =>
      `${token.name} ${token.symbol} ${token.caliber} ${token.category}`
        .toLowerCase()
        .includes(term)
    );
  }, [tokens, debouncedSearchTerm]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle sort change
  const handleSortChange = (option: SortOption) => {
    setSortBy(option);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4 md:py-6">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-blue-600"></div>
          <p className="text-xs md:text-sm text-gray-500">
            Loading your ammunition...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 md:space-y-3">
      <div className="bg-gray-50 rounded-lg p-3 md:p-4 border border-gray-100">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 md:w-5 md:h-5 text-gray-500"
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
          </div>
          <p className="text-xs md:text-sm text-gray-600 max-w-md">
            Browse available ammunition below and click &quot;Purchase&quot; to
            buy on Uniswap.
          </p>
        </div>
      </div>

      {/* Search Input for Available Ammunition */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search ammunition..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-2 md:right-3 top-1.5 md:top-2.5 text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-3 h-3 md:w-4 md:h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Sort Options */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-1 text-xs">
          <button
            onClick={() => handleSortChange("name")}
            className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded ${
              sortBy === "name"
                ? "bg-blue-100 text-blue-700 font-medium"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Name
          </button>
          <button
            onClick={() => handleSortChange("quantity")}
            className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded ${
              sortBy === "quantity"
                ? "bg-blue-100 text-blue-700 font-medium"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Price
          </button>
          <button
            onClick={() => handleSortChange("value")}
            className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded ${
              sortBy === "value"
                ? "bg-blue-100 text-blue-700 font-medium"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Category
          </button>
        </div>
        <span className="text-xs text-gray-500">
          {filteredTokens.length}{" "}
          {filteredTokens.length === 1 ? "type" : "types"}
        </span>
      </div>

      {/* No Results Message */}
      {filteredTokens.length === 0 && searchTerm && (
        <div className="bg-gray-50 rounded-lg p-3 md:p-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 md:w-5 md:h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-xs md:text-sm text-gray-500">
              No ammunition matching &quot;{searchTerm}&quot;
            </p>
          </div>
        </div>
      )}

      {/* Available Ammunition Grid */}
      <div className="grid grid-cols-1 space-y-2">
        {filteredTokens.map((token) => (
          <button
            key={token.address}
            className="flex flex-col bg-gray-50 rounded-lg p-2 border border-gray-100 hover:bg-blue-50 hover:border-blue-100 transition-all cursor-pointer group"
            onClick={() => onTokenAction(token, "purchase")}
          >
            <div className="flex flex-col gap-1">
              <div className="flex flex-row gap-1 md:gap-2 items-center justify-start">
                {token.icon ? (
                  <Image
                    src={token.icon}
                    alt={token.symbol}
                    className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0"
                    width={40}
                    height={40}
                  />
                ) : (
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs md:text-sm flex-shrink-0">
                    {token.symbol.slice(0, 2)}
                  </div>
                )}
                <span className="font-medium text-gray-800 group-hover:text-blue-700 transition-colors flex-grow">
                  {token.name}
                </span>
              </div>
              <TokenPriceDisplay token={token} />
            </div>

            <div className="flex flex-row justify-between items-end gap-1.5">
              {/* Token property chips */}
              <div className="flex flex-wrap gap-1.5 my-1.5">
                {token.category && (
                  <TokenPropertyChip type="category" value={token.category} />
                )}
                {token.caliber && (
                  <TokenPropertyChip type="caliber" value={token.caliber} />
                )}
                {token.weight && (
                  <TokenPropertyChip type="weight" value={token.weight} />
                )}
                {token.manufacturer && (
                  <TokenPropertyChip
                    type="manufacturer"
                    value={token.manufacturer}
                  />
                )}
                {token.symbol && (
                  <TokenPropertyChip type="symbol" value={token.symbol} />
                )}
              </div>

              <div className="text-blue-600 text-xs md:text-sm opacity-80 group-hover:opacity-100 transition-opacity self-end w-[35%] text-right">
                Purchase →
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
