"use client";

import { useState, useMemo, useEffect } from "react";
import { useAccount, useBalance } from "wagmi";
import { getTokensForChain, type TokenInfo, USDC_ADDRESS } from "../addresses";
import { Button } from "./Button";
import { ShippingForm } from "./ShippingForm";
import { TokenBalanceSummary } from "./TokenBalanceSummary";
import { TokenSelectorDialog } from "./TokenSelectorDialog";
import { PurchaseDialog } from "./PurchaseDialog";
import { Transition } from "@headlessui/react";

/**
 * ConnectedAccountTokenInfo displays token balances and provides interfaces
 * for purchasing and shipping tokens.
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
    <div className="fixed bottom-0 left-0 right-0 md:bottom-4 md:left-4 md:right-auto max-w-full w-full md:max-w-sm">
      <div className="space-y-2 sm:space-y-4">
        {/* Token Selector Dialog */}
        <TokenSelectorDialog
          isOpen={isSelectorOpen}
          onClose={() => setIsSelectorOpen(false)}
          onSelectToken={handleSelectToken}
          mode={selectorMode}
        />

        {/* Shipping Form Dialog */}
        {selectedToken && address && (
          <ShippingForm
            isOpen={isShippingOpen}
            onClose={() => setIsShippingOpen(false)}
            address={address as `0x${string}`}
            tokenAddress={selectedToken.address as `0x${string}`}
          />
        )}

        {/* Purchase Dialog */}
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

        {/* Token Balance Summary Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Header with expand/collapse button */}
          <div
            className="p-3 md:p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center justify-between w-full gap-2">
              <h2 className="text-base md:text-lg font-bold text-gray-800">
                Your Ammunition
              </h2>
              <div className="text-xs md:text-sm text-gray-500">
                <span className="font-medium text-gray-700">
                  ${formattedUsdcBalance}
                </span>{" "}
                USDC
              </div>
            </div>
            <button
              className="ml-1 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              aria-label={isExpanded ? "Collapse panel" : "Expand panel"}
            >
              <svg
                className={`w-5 h-5 transform transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          {/* Collapsible content */}
          <div
            className={`
              transition-[max-height,opacity,transform] duration-300 ease-out overflow-hidden
              ${isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}
            `}
          >
            <div
              className={`
              p-3 md:p-4 pt-0 border-t border-gray-100
              transition-transform duration-300
              ${isExpanded ? "translate-y-0" : "-translate-y-4"}
            `}
            >
              <TokenBalanceSummary onTokenAction={handleSelectToken} />

              <div className="flex flex-row justify-between mt-2 pt-2 gap-2 sm:gap-4">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectorMode("purchase");
                    setIsSelectorOpen(true);
                  }}
                  variant="secondary"
                  className="w-full sm:flex-1"
                >
                  <div className="flex items-center justify-center">
                    <span className="text-sm md:text-base">Buy Ammunition</span>
                  </div>
                </Button>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectorMode("ship");
                    setIsSelectorOpen(true);
                  }}
                  className="w-full sm:flex-1"
                >
                  <div className="flex items-center justify-center">
                    <span className="text-sm md:text-base">
                      Ship Ammunition
                    </span>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectedAccountTokenInfo;
