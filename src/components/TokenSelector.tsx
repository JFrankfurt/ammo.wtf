import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { getTokensForChain, type TokenInfo } from "../addresses";
import { useTokenBalances } from "../hooks/useTokenBalances";
import { FormInput } from "./FormInput";
import { FormSelect } from "./FormSelect";
import { cn } from "../utils/cn"; // Import cn

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
  const [sortBy, setSortBy] = useState<"name" | "caliber">("name");

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
      {/* Search and filter controls - Use themed FormInput/Select */}
      <div className="mb-4 space-y-3">
        <FormInput
          label="Search"
          placeholder="Search name, symbol, caliber..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sizeVariant="small" // Use small variant for text-xs
        />

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <FormSelect
            label="Sort by"
            options={[
              { value: "name", label: "Name" },
              { value: "caliber", label: "Caliber" },
              // { value: "price", label: "Price" }, // Price sorting disabled
            ]}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "name" | "caliber")}
            sizeVariant="small" // Use small variant for text-xs
            className="w-full sm:w-auto"
          />

          {/* Item count - themed */}
          <div className="text-xs font-mono text-muted mt-2 sm:mt-0">
            {filteredTokens.length} item{filteredTokens.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      {/* Token list */}
      {filteredTokens.length === 0 ? (
        // No results state - themed
        <div className="text-center py-8 px-4 bg-muted/10 rounded-none border border-border">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-muted/20 rounded-none flex items-center justify-center">
              {/* Icon - themed */}
              <svg
                className="w-6 h-6 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-3"
                />
              </svg>
            </div>
            <div>
              {/* Text - themed */}
              <p className="text-foreground font-medium font-mono text-sm">
                No ammunition found
              </p>
              <p className="text-xs text-muted font-mono mt-1">
                Try adjusting search or sort options
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Token list container - themed scrollbar potentially
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {filteredTokens.map((token) => (
            // List item - themed
            <div
              key={token.address}
              className="border border-border rounded-none p-3 hover:bg-muted/20 bg-muted/10 transition-all cursor-pointer"
              onClick={() =>
                onSelectToken({
                  ...token,
                  address: token.address as `0x${string}`,
                })
              }
            >
              <div className="flex items-start gap-3">
                {/* Icon - themed */}
                {token.icon ? (
                  <img
                    src={token.icon}
                    alt={token.symbol}
                    className="w-8 h-8 flex-shrink-0 object-cover rounded-full"
                    width={32}
                    height={32}
                  />
                ) : (
                  <div className="w-8 h-8 bg-muted/30 rounded-full flex-shrink-0 flex items-center justify-center text-foreground font-bold font-mono text-xs">
                    {token.symbol.slice(0, 2)}
                  </div>
                )}

                <div className="flex-grow min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div className="min-w-0">
                      {/* Symbol - themed */}
                      <div className="font-medium text-foreground font-mono text-sm truncate">
                        {token.symbol}
                      </div>
                      {/* Name - themed */}
                      <div
                        className="text-xs text-muted font-mono truncate"
                        title={token.name}
                      >
                        {token.name}
                      </div>
                    </div>

                    {/* Price chip - themed */}
                    <div className="text-xs font-mono bg-muted/20 text-muted px-2 py-0.5 rounded-full whitespace-nowrap self-start sm:self-center">
                      $10.00 {/* Assuming fixed price */}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {/* Caliber chip - themed */}
                    {token.caliber && (
                      <div className="text-xs font-mono bg-muted/20 text-muted px-2 py-0.5 rounded-full">
                        {token.caliber}
                      </div>
                    )}

                    {/* Balance chip - themed */}
                    {tokenBalances[token.address] > 0 && (
                      <div className="text-xs font-mono bg-accentGreen/10 text-accentGreen px-2 py-0.5 rounded-full ml-auto">
                        {tokenBalances[token.address].toLocaleString()} bal.
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
