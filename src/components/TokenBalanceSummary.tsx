import Image from "next/image";
import { useAccount } from "wagmi";
import { useState, useMemo } from "react";
import { getTokensForChain, type TokenInfo } from "../addresses";
import { useTokenBalances } from "../hooks/useTokenBalances";

interface TokenBalanceSummaryProps {
  onShip: (token: TokenInfo) => void;
}

type SortOption = "name" | "quantity" | "value";

export const TokenBalanceSummary = ({ onShip }: TokenBalanceSummaryProps) => {
  const { chainId, address } = useAccount();
  const [expandedView, setExpandedView] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name");

  // Get all tokens for the current chain
  const tokens = useMemo(
    () => (chainId ? getTokensForChain(chainId) : []),
    [chainId]
  );

  // Get token balances
  const { balances, isLoading } = useTokenBalances(
    tokens,
    address as `0x${string}`
  );

  // Filter tokens with positive balances and apply search/sort
  const tokensWithBalance = useMemo(() => {
    // First filter tokens with positive balances
    let filteredTokens = tokens.filter((token) => balances[token.address] > 0);

    // Apply search filter if search term exists
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filteredTokens = filteredTokens.filter(
        (token) =>
          token.name.toLowerCase().includes(term) ||
          token.symbol.toLowerCase().includes(term) ||
          token.caliber?.toLowerCase().includes(term) ||
          token.category?.toLowerCase().includes(term)
      );
    }

    // Sort tokens based on selected sort option
    return filteredTokens.sort((a, b) => {
      switch (sortBy) {
        case "quantity":
          return balances[b.address] - balances[a.address];
        case "value":
          // Sort by value (quantity * price)
          const valueA = (balances[a.address] || 0) * (a.priceUsd || 0);
          const valueB = (balances[b.address] || 0) * (b.priceUsd || 0);
          return valueB - valueA;
        case "name":
        default:
          return a.symbol.localeCompare(b.symbol);
      }
    });
  }, [tokens, balances, searchTerm, sortBy]);

  // Constants for pagination
  const TOKENS_PER_PAGE_COLLAPSED = 3;
  const TOKENS_PER_PAGE_EXPANDED = 6;
  const tokensPerPage = expandedView
    ? TOKENS_PER_PAGE_EXPANDED
    : TOKENS_PER_PAGE_COLLAPSED;
  const totalPages = Math.max(
    1,
    Math.ceil(tokensWithBalance.length / tokensPerPage)
  );

  // Get current page tokens
  const startIndex = currentPage * tokensPerPage;
  const endIndex = startIndex + tokensPerPage;
  const currentTokens = tokensWithBalance.slice(startIndex, endIndex);

  // Handle pagination
  const goToNextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  // Toggle expanded view
  const toggleExpandedView = () => {
    setExpandedView(!expandedView);
    setCurrentPage(0); // Reset to first page when toggling view
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(0); // Reset to first page when search changes
  };

  // Handle sort change
  const handleSortChange = (option: SortOption) => {
    setSortBy(option);
    setCurrentPage(0); // Reset to first page when sort changes
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

  if (tokensWithBalance.length === 0 && !searchTerm) {
    return (
      <div className="bg-gray-50 rounded-lg p-3 md:p-4 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 md:w-6 md:h-6 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4M8 16l-4-4 4-4"
              />
            </svg>
          </div>
          <p className="text-xs md:text-sm text-gray-500">
            Select &quot;View All&quot; to see available ammunition
          </p>
        </div>
      </div>
    );
  }

  // Display tokens with balances
  return (
    <div className="space-y-2 md:space-y-3">
      {/* Search and Sort Controls */}
      <div className="flex flex-col space-y-2">
        {/* Search Input */}
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
              Quantity
            </button>
            <button
              onClick={() => handleSortChange("value")}
              className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded ${
                sortBy === "value"
                  ? "bg-blue-100 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Value
            </button>
          </div>
          <span className="text-xs text-gray-500">
            {tokensWithBalance.length}{" "}
            {tokensWithBalance.length === 1 ? "type" : "types"}
          </span>
        </div>
      </div>

      {/* No Results Message */}
      {tokensWithBalance.length === 0 && searchTerm && (
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

      {/* Token Grid */}
      {tokensWithBalance.length > 0 && (
        <div
          className={`grid ${
            expandedView
              ? "grid-cols-1 sm:grid-cols-2 gap-2"
              : "grid-cols-1 space-y-2"
          }`}
        >
          {currentTokens.map((token) => (
            <div
              key={token.address}
              className="bg-gray-50 rounded-lg p-2 md:p-3 border border-gray-100 hover:bg-blue-50 hover:border-blue-100 transition-all cursor-pointer group"
              onClick={() => onShip(token)}
            >
              <div className="flex justify-between items-center gap-1 md:gap-2">
                <div className="flex items-start gap-1.5 md:gap-2">
                  {token.icon ? (
                    <Image
                      src={token.icon}
                      alt={token.symbol}
                      className="w-8 h-8 md:w-10 md:h-10"
                      width={40}
                      height={40}
                    />
                  ) : (
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs md:text-sm">
                      {token.symbol.slice(0, 2)}
                    </div>
                  )}
                  <div className="max-w-[calc(100%-2.5rem)] md:max-w-[calc(100%-3.5rem)]">
                    <div className="font-medium text-xs md:text-sm text-gray-800 group-hover:text-blue-700 transition-colors truncate">
                      {token.symbol}
                    </div>
                    <div className="text-xs md:text-sm text-gray-600 break-words">
                      {balances[token.address]?.toFixed(2) || "0"} rounds
                      {token.priceUsd && (
                        <span className="text-xs text-gray-500 ml-1 hidden sm:inline">
                          ($
                          {(balances[token.address] * token.priceUsd).toFixed(
                            2
                          )}
                          )
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-blue-600 text-xs md:text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  Ship →
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination and View Controls */}
      {tokensWithBalance.length > TOKENS_PER_PAGE_COLLAPSED && (
        <div className="flex items-center justify-between mt-2 md:mt-3 pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-1 md:space-x-2">
            <button
              onClick={goToPrevPage}
              disabled={totalPages <= 1}
              className="p-0.5 md:p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <svg
                className="w-4 h-4 md:w-5 md:h-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <span className="text-xs text-gray-500">
              {currentPage + 1}/{totalPages}
            </span>

            <button
              onClick={goToNextPage}
              disabled={totalPages <= 1}
              className="p-0.5 md:p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <svg
                className="w-4 h-4 md:w-5 md:h-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          <button
            onClick={toggleExpandedView}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            {expandedView ? "Collapse View" : "Expand View"}
          </button>
        </div>
      )}
    </div>
  );
};
