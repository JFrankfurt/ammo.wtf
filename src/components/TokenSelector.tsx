"use client";

import Image from "next/image";
import { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { getTokensForChain, type TokenInfo } from "../addresses";
import { useTokenBalances } from "../hooks/useTokenBalances";
import { FormInput } from "./FormInput";
import { FormSelect } from "./FormSelect";

interface TokenSelectorProps {
  onSelectToken: (token: TokenInfo) => void;
  showBalancesOnly?: boolean;
  filterByCategory?: string;
}

export const TokenSelector = ({
  onSelectToken,
  showBalancesOnly = false,
  filterByCategory,
}: TokenSelectorProps) => {
  const { address, chainId } = useAccount();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "caliber" | "price">("name");

  // Get all tokens for the current chain
  const allTokens = useMemo(() => {
    if (!chainId) return [];
    return getTokensForChain(chainId);
  }, [chainId]);

  // Get token balances using a custom hook
  const { balances: tokenBalances } = useTokenBalances(
    allTokens,
    address as `0x${string}`
  );

  // Filter and sort tokens
  const filteredTokens = useMemo(() => {
    let filtered = allTokens;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (token) =>
          token.name.toLowerCase().includes(term) ||
          token.symbol.toLowerCase().includes(term) ||
          token.caliber?.toLowerCase().includes(term) ||
          token.category?.toLowerCase().includes(term) ||
          token.manufacturer?.toLowerCase().includes(term)
      );
    }

    // Filter by category
    if (filterByCategory) {
      filtered = filtered.filter(
        (token) =>
          token.category?.toLowerCase() === filterByCategory.toLowerCase()
      );
    }

    // Filter by balance if showBalancesOnly prop is true
    if (showBalancesOnly) {
      filtered = filtered.filter((token) => tokenBalances[token.address] > 0);
    }

    // Sort tokens
    return filtered.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "caliber") {
        // Handle cases where caliber might be missing
        if (!a.caliber && !b.caliber) return 0;
        if (!a.caliber) return 1; // Move items without caliber to the end
        if (!b.caliber) return -1; // Move items without caliber to the end
        return a.caliber.localeCompare(b.caliber);
      } else if (sortBy === "price") {
        // priceUsd is no longer supported, using fixed price for sorting
        // All tokens have the same fixed price of $10.00
        return 0; // No sorting by price since all prices are the same
      }
      return 0;
    });
  }, [
    allTokens,
    searchTerm,
    filterByCategory,
    showBalancesOnly,
    sortBy,
    tokenBalances,
  ]);

  return (
    <div className="w-full">
      {/* Search and filter controls */}
      <div className="mb-5 space-y-4">
        <FormInput
          label="Search"
          placeholder="Search ammunition..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="flex items-center">
            <FormSelect
              label="Sort by"
              options={[
                { value: "name", label: "Name" },
                { value: "caliber", label: "Caliber" },
                { value: "price", label: "Price" },
              ]}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full sm:w-auto"
            />
          </div>

          <div className="text-sm text-gray-500 mt-2 sm:mt-0">
            {filteredTokens.length}{" "}
            {filteredTokens.length === 1 ? "item" : "items"}
          </div>
        </div>
      </div>

      {/* Token list */}
      {filteredTokens.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
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
              <p className="text-gray-700 font-medium">No ammunition found</p>
              <p className="text-sm text-gray-500 mt-1">
                Try adjusting your search criteria
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {filteredTokens.map((token) => (
            <div
              key={token.address}
              className="border border-gray-200 rounded-xl p-4 hover:bg-blue-50 transition-all cursor-pointer bg-white"
              onClick={() =>
                onSelectToken({
                  ...token,
                  address: token.address as `0x${string}`,
                })
              }
            >
              <div className="flex items-start gap-3">
                {token.icon ? (
                  <Image
                    src={token.icon}
                    alt={token.symbol}
                    className="w-10 h-10 flex-shrink-0"
                    width={40}
                    height={40}
                  />
                ) : (
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex-shrink-0 flex items-center justify-center text-blue-700 font-bold">
                    {token.symbol.slice(0, 2)}
                  </div>
                )}

                <div className="flex-grow min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-gray-800 truncate">
                        {token.symbol}
                      </div>
                      <div
                        className="text-sm text-gray-600 truncate"
                        title={token.name}
                      >
                        {token.name}
                      </div>
                    </div>

                    {/* priceUsd is no longer supported, showing fixed price */}
                    <div className="text-xs font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-full whitespace-nowrap self-start">
                      $10.00
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {token.caliber && (
                      <div className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full flex items-center gap-1">
                        <span>{token.caliber}</span>
                      </div>
                    )}

                    {tokenBalances[token.address] > 0 && (
                      <div className="text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1 ml-auto">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        <span>
                          {tokenBalances[token.address].toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
