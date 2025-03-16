"use client";

import { useState, useMemo } from "react";
import { useAccount, useBalance } from "wagmi";
import { getTokensForChain, type TokenInfo, USDC_ADDRESS } from "../addresses";
import { Button } from "./Button";
import { ShippingForm } from "./ShippingForm";
import { TokenBalanceSummary } from "./TokenBalanceSummary";
import { TokenSelectorDialog } from "./TokenSelectorDialog";
import { PurchaseDialog } from "./PurchaseDialog";

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
  const { status, address, chainId } = useAccount();

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
    <div className="fixed bottom-0 left-0 right-0 md:bottom-4 md:left-4 md:right-auto max-w-full w-full md:max-w-sm p-4 md:p-0 bg-gray-50 md:bg-transparent border-t border-gray-200 md:border-0 z-40">
      <div className="space-y-4">
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
          <div className="p-3 md:p-4">
            <div className="flex justify-between items-center mb-3 md:mb-4">
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

            <TokenBalanceSummary onTokenAction={handleSelectToken} />

            <div className="flex flex-col sm:flex-row justify-between mt-2 pt-2 gap-2 sm:gap-4">
              <Button
                onClick={() => {
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
                onClick={() => {
                  setSelectorMode("ship");
                  setIsSelectorOpen(true);
                }}
                className="w-full sm:flex-1"
              >
                <div className="flex items-center justify-center">
                  <span className="text-sm md:text-base">Ship Ammunition</span>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectedAccountTokenInfo;
