import { useState, useMemo, useEffect } from "react";
import { useAccount, useBalance } from "wagmi";
import { getTokensForChain, type TokenInfo, USDC_ADDRESS } from "../addresses";
import { Button } from "./Button";
import { ShippingForm } from "./ShippingForm";
import { TokenBalanceSummary } from "./TokenBalanceSummary";
import { TokenSelectorDialog } from "./TokenSelectorDialog";
import { PurchaseDialog } from "./PurchaseDialog";
import { Transition } from "@headlessui/react";
import { cn } from "@/utils/cn";

/**
 * ConnectedAccountTokenInfo displays token balances and provides interfaces
 * for purchasing and shipping tokens, styled with a hacker theme.
 */
const ConnectedAccountTokenInfo = () => {
  const [isShippingOpen, setIsShippingOpen] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [selectorMode, setSelectorMode] = useState<"ship" | "purchase">("ship");
  const [isExpanded, setIsExpanded] = useState(false);
  const { status, address, chainId } = useAccount();

  // Initialize expanded state based on screen size
  useEffect(() => {
    const handleResize = () => {
      setIsExpanded(window.innerWidth >= 768); // 768px is our md breakpoint
    };

    // Set initial state
    handleResize();

    // Add resize listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Get USDC balance
  const { data: usdcBalance, isLoading: isLoadingUsdcBalance } = useBalance({
    address,
    token: chainId ? USDC_ADDRESS[chainId] : undefined,
  });

  // Format USDC balance for display
  const formattedUsdcBalance = useMemo(() => {
    if (!usdcBalance) return "0.00";
    return parseFloat(usdcBalance.formatted).toFixed(2);
  }, [usdcBalance]);

  const openShippingForm = (token: TokenInfo) => {
    setSelectedToken(token);
    setIsShippingOpen(true);
    setIsSelectorOpen(false);
  };

  const openPurchaseDialog = (token: TokenInfo) => {
    setSelectedToken(token);
    setIsPurchaseOpen(true);
    setIsSelectorOpen(false);
  };

  const handleSelectToken = (token: TokenInfo, action: "ship" | "purchase") => {
    if (action === "ship") {
      openShippingForm(token);
    } else {
      openPurchaseDialog(token);
    }
  };

  const handlePurchaseSuccess = (txHash: string) => {
    // Handle successful purchase
    setIsPurchaseOpen(false);
    // You might want to show a success message or update balances
  };

  const handlePurchaseError = (error: Error) => {
    // Handle purchase error
    console.error("Purchase error:", error);
    // You might want to show an error message
  };

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40",
        "md:bottom-4 md:left-4 md:right-auto",
        "max-w-full w-full md:max-w-sm"
      )}
    >
      <div className="space-y-2">
        {/* Dialogs: Assume these will be styled internally later */}
        <TokenSelectorDialog
          isOpen={isSelectorOpen}
          onClose={() => setIsSelectorOpen(false)}
          onSelectToken={handleSelectToken}
          mode={selectorMode}
        />
        {selectedToken && address && (
          <ShippingForm
            isOpen={isShippingOpen}
            onClose={() => setIsShippingOpen(false)}
            address={address as `0x${string}`}
            tokenAddress={selectedToken.address as `0x${string}`}
          />
        )}
        {selectedToken && (
          <PurchaseDialog
            isOpen={isPurchaseOpen}
            onClose={() => setIsPurchaseOpen(false)}
            tokenAddress={selectedToken.address}
            tokenName={selectedToken.name}
            tokenSymbol={selectedToken.symbol}
            onSuccess={handlePurchaseSuccess}
            onError={handlePurchaseError}
          />
        )}

        {/* Token Balance Summary Card - Themed */}
        <div
          className={cn(
            "bg-background/80",
            "backdrop-blur-sm",
            "border border-border",
            "rounded-t-md md:rounded-b-md md:rounded-t-md",
            "overflow-hidden"
          )}
        >
          {/* Header with expand/collapse button - Themed */}
          <div
            className={cn(
              "p-3 flex justify-between items-center",
              "cursor-pointer",
              "hover:bg-muted/20",
              "transition-colors duration-150"
            )}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center justify-between w-full gap-2">
              <h2 className="text-base md:text-lg font-bold text-accentGreen">
                Your Ammunition
              </h2>
              <div className="font-mono">
                <span className="font-medium text-accentGreen">
                  ${formattedUsdcBalance}
                </span>{" "}
                USDC
              </div>
            </div>
            <button
              className={cn(
                "ml-2 p-1",
                "text-muted hover:text-foreground",
                "transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
              )}
              aria-label={isExpanded ? "Collapse panel" : "Expand panel"}
            >
              <svg
                className={cn(
                  "w-5 h-5 transform transition-transform duration-200",
                  isExpanded ? "rotate-180" : ""
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          {/* Collapsible content - Apply max-height animation */}
          <div
            className={cn(
              "transition-[max-height,opacity] duration-300 ease-out",
              isExpanded ? "max-h-[60vh] opacity-100" : "max-h-0 opacity-0"
            )}
          >
            {/* Inner container handles border, padding, and scrolling */}
            <div
              className={cn(
                "overflow-y-auto",
                "border-t border-border",
                "max-h-[60vh]"
              )}
            >
              {/* Padding applied here so it's part of the scrollable area */}
              <div className="p-3 pt-2">
                <TokenBalanceSummary onTokenAction={handleSelectToken} />
              </div>

              {/* Action Buttons Container - Sticky at the bottom */}
              <div className="sticky bottom-0 p-3 border-t border-border bg-background/80 backdrop-blur-sm">
                <div className="flex flex-row justify-between gap-3">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectorMode("purchase");
                      setIsSelectorOpen(true);
                    }}
                    variant="secondary"
                    className="flex-1"
                  >
                    Buy Ammo
                  </Button>

                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectorMode("ship");
                      setIsSelectorOpen(true);
                    }}
                    variant="primary"
                    className="flex-1"
                  >
                    Ship Ammo
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectedAccountTokenInfo;
