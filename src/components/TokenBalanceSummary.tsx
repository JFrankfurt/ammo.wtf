import Image from "next/image";
import { useAccount } from "wagmi";
import { useState, useMemo, useCallback } from "react";
import { getTokensForChain, type TokenInfo } from "../addresses";
import { useTokenBalances } from "../hooks/useTokenBalances";
import { TokenPriceDisplay } from "./TokenPriceDisplay";
import { TokenPropertyChip } from "./TokenPropertyChip";
import { fallbackChainId } from "../utils/chains";
import { useDebounceValue } from "usehooks-ts";

interface TokenBalanceSummaryProps {
  onTokenAction: (token: TokenInfo, action: "purchase" | "ship") => void;
}

export const TokenBalanceSummary = ({
  onTokenAction,
}: TokenBalanceSummaryProps) => {
  const { chainId, address } = useAccount();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounceValue(searchTerm, 500);
  const [sortBy, setSortBy] = useState<"name" | "price" | "value">("name");

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

  // Sort tokens based on selected sort option
  const sortedTokens = useMemo(() => {
    return [...filteredTokens].sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "price") {
        // Placeholder for price sorting - would need actual price data
        return a.symbol.localeCompare(b.symbol);
      } else {
        // Sort by category
        const catA = a.category || "";
        const catB = b.category || "";
        return catA.localeCompare(catB);
      }
    });
  }, [filteredTokens, sortBy]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle sort change
  const handleSortChange = useCallback((sort: "name" | "price" | "value") => {
    setSortBy(sort);
  }, []);

  // Check if user has a balance of a specific token
  const hasBalance = useCallback(
    (tokenAddress: string) => {
      const address = tokenAddress as `0x${string}`;
      return (balances[address] || 0) > 0;
    },
    [balances]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-sm text-gray-600 font-medium">
            Loading your ammunition...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-4 max-h-[70vh] flex flex-col">
      {/* Info Banner - Only shown on taller screens */}
      <div className="hidden min-h-[600px]:block bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-100 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-blue-600"
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
          <p className="text-sm text-blue-800">
            Browse available ammunition below and click &quot;Purchase&quot; to
            buy on Uniswap.
          </p>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-lg space-y-1 sm:space-y-3 flex-shrink-0">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search ammunition..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-4 h-4"
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
        <div className="flex justify-start items-center gap-2">
          <div className="flex">
            <span className="text-xs text-gray-500 mr-2 self-center">
              Sort by:
            </span>
            <div className="flex space-x-1 text-xs bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => handleSortChange("name")}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  sortBy === "name"
                    ? "bg-white text-blue-700 font-medium shadow-sm"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                Name
              </button>
              <button
                onClick={() => handleSortChange("price")}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  sortBy === "price"
                    ? "bg-white text-blue-700 font-medium shadow-sm"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                Price
              </button>
              <button
                onClick={() => handleSortChange("value")}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  sortBy === "value"
                    ? "bg-white text-blue-700 font-medium shadow-sm"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                Category
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* No Results Message */}
      {filteredTokens.length === 0 && searchTerm && (
        <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200 shadow-sm flex-shrink-0">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-gray-400"
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
            <div>
              <p className="text-gray-700 font-medium">No results found</p>
              <p className="text-sm text-gray-500 mt-1">
                No ammunition matching &quot;{searchTerm}&quot;
              </p>
            </div>
            <button
              onClick={() => setSearchTerm("")}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear search
            </button>
          </div>
        </div>
      )}

      {/* Available Ammunition */}
      <div className="overflow-y-auto flex-grow min-h-0">
        <div className="space-y-2">
          {sortedTokens.map((token) => (
            <div
              key={token.address}
              className="bg-white rounded-lg border border-transparent transition-all px-2 py-1 relative group"
            >
              <div className="flex flex-col gap-1">
                {/* Token Header */}
                <div className="flex items-center gap-2">
                  {token.icon ? (
                    <Image
                      src={token.icon}
                      alt={token.symbol}
                      className="hidden sm:block w-10 h-10 rounded-full flex-shrink-0"
                      width={40}
                      height={40}
                    />
                  ) : (
                    <div className="hidden sm:flex w-10 h-10 bg-blue-100 rounded-full  items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                      {token.symbol.slice(0, 2)}
                    </div>
                  )}
                  <div className="flex-grow">
                    <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                      {token.name}
                    </h3>
                    <TokenPriceDisplay token={token} />
                  </div>
                </div>

                {/* Token Properties */}
                <div className="flex flex-wrap gap-2">
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

                {/* Action Buttons */}
                <div className="flex justify-between gap-2 items-center">
                  {/* Balance Badge */}
                  <div className="text-xs">
                    {hasBalance(token.address) ? (
                      <span className="text-green-800">
                        Balance:{" "}
                        {(
                          balances[token.address as `0x${string}`] || 0
                        ).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-gray-500 whitespace-nowrap">
                        No balance
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={!hasBalance(token.address)}
                      onClick={() => onTokenAction(token, "ship")}
                      className={`px-4 py-1 text-sm rounded-md font-medium transition-colors ${
                        hasBalance(token.address)
                          ? "bg-gray-100 text-gray-800 hover:bg-gray-200"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      Ship
                    </button>
                    <button
                      onClick={() => onTokenAction(token, "purchase")}
                      onMouseEnter={(e) =>
                        e.currentTarget
                          .closest(".group")
                          ?.classList.add("border-blue-300", "bg-blue-50")
                      }
                      onMouseLeave={(e) =>
                        e.currentTarget
                          .closest(".group")
                          ?.classList.remove("border-blue-300", "bg-blue-50")
                      }
                      className="px-4 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                    >
                      Purchase
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
