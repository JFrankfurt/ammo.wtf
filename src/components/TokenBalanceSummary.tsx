import { getTokensForChain, type TokenInfo } from "@/addresses";
import { TokenPriceDisplay } from "@/components/TokenPriceDisplay";
import { TokenPropertyChip } from "@/components/TokenPropertyChip";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { fallbackChainId } from "@/utils/chains";
import { useCallback, useMemo, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { useAccount } from "wagmi";
import { Button } from "./Button";
import { isSupportedNetwork } from "@/utils/networks";
import { sepolia } from "viem/chains";
import { cn } from "@/utils/cn";

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
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accentGreen"></div>
          <p className="font-medium font-mono">Loading ammunition...</p>
        </div>
      </div>
    );
  }

  let infoMessageText =
    'Browse available ammunition below and click "Purchase" to buy on Uniswap.';

  if (!isSupportedNetwork(chainId ?? fallbackChainId)) {
    infoMessageText =
      "Please switch to a supported network (e.g., Base, Sepolia) to browse ammunition.";
  }

  return (
    <div className="flex flex-col space-y-3">
      <div
        className={cn(
          "block",
          "bg-muted/10 rounded-md p-3",
          "border border-border",
          "flex-shrink-0"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-muted/20 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-4 h-4 text-accentGreen"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="font-mono text-muted">{infoMessageText}</p>
        </div>
      </div>

      {Boolean(chainId && chainId !== sepolia.id) && (
        <Button variant="secondary" className="w-full text-center">
          <span>
            Stay tuned for mainnet launch! Until then, play on Sepolia.
          </span>
        </Button>
      )}

      {/* No Results Message */}
      {filteredTokens.length === 0 && searchTerm && (
        <div className="bg-muted/10 rounded-md p-6 text-center border border-border mt-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 bg-muted/20 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-accentRed"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium font-mono text-foreground">
                No results found
              </p>
              <p className="mt-1 font-mono text-muted">
                No ammunition matching &quot;{searchTerm}&quot;
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => setSearchTerm("")}
              className="mt-2"
            >
              Clear search
            </Button>
          </div>
        </div>
      )}

      {/* Available Ammunition */}
      <div className="overflow-y-auto flex-grow min-h-0">
        <div className="space-y-2">
          {sortedTokens.map((token) => (
            <div
              key={token.address}
              className={cn(
                "rounded-md border border-border",
                "bg-muted/20",
                "transition-colors duration-150",
                "px-3 py-2"
              )}
            >
              <div className="flex flex-col gap-2">
                {/* Token Header */}
                <div className="flex items-center gap-3">
                  {token.icon ? (
                    <img
                      src={token.icon}
                      alt={token.symbol}
                      className="hidden sm:block w-8 h-8 rounded-full flex-shrink-0"
                      width={32}
                      height={32}
                    />
                  ) : (
                    <div className="hidden sm:flex w-8 h-8 bg-muted/30 rounded-full items-center justify-center text-foreground font-bold flex-shrink-0 font-mono">
                      {token.symbol.slice(0, 2)}
                    </div>
                  )}
                  <div className="flex-grow">
                    <h3 className="font-medium text-foreground font-mono">
                      {token.name}
                    </h3>
                    <TokenPriceDisplay token={token} />
                  </div>
                </div>

                {/* Token Properties */}
                <div className="flex flex-wrap gap-1.5">
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
                <div className="flex justify-between gap-2 items-center mt-1">
                  {/* Balance Badge */}
                  <div className="font-mono">
                    {hasBalance(token.address) ? (
                      <span className="text-accentGreen">
                        Balance:{" "}
                        {(
                          balances[token.address as `0x${string}`] || 0
                        ).toLocaleString()}
                      </span>
                    ) : (
                      <span className="font-mono text-muted">No balance</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      disabled={!hasBalance(token.address)}
                      onClick={() => onTokenAction(token, "ship")}
                    >
                      Ship
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => onTokenAction(token, "purchase")}
                    >
                      Purchase
                    </Button>
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
