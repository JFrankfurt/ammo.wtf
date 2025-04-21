import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { useAccount, useBalance } from "wagmi";
import { getTokensForChain, type TokenInfo, USDC_ADDRESS } from "../addresses";
import { Button } from "./Button";
import { TokenBalanceSummary } from "./TokenBalanceSummary";
import { Transition } from "@headlessui/react";
import { cn } from "@/utils/cn";

// Lazy load dialog components to reduce initial bundle size.
// These components will only be loaded when they are needed (i.e., when their respective isOpen state is true).
const ShippingForm = lazy(() =>
  import("./ShippingForm").then((module) => ({ default: module.ShippingForm }))
);
const TokenSelectorDialog = lazy(() =>
  import("./TokenSelectorDialog").then((module) => ({
    default: module.TokenSelectorDialog,
  }))
);
const PurchaseDialog = lazy(() =>
  import("./PurchaseDialog").then((module) => ({
    default: module.PurchaseDialog,
  }))
);

/**
 * ConnectedAccountTokenInfo displays token balances and provides interfaces
 * for purchasing and shipping tokens, styled with a hacker theme.
 * Optimized for performance via lazy loading and callback memoization.
 */
const ConnectedAccountTokenInfo = () => {
  const [isShippingOpen, setIsShippingOpen] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [selectorMode, setSelectorMode] = useState<"ship" | "purchase">("ship");
  const [isExpanded, setIsExpanded] = useState(false);
  const { status, address, chainId } = useAccount();

  // Initialize expanded state based on screen size using useEffect.
  // This effect runs once on mount and then only when the window resizes.
  useEffect(() => {
    const handleResize = () => {
      // Set initial state based on md breakpoint (768px).
      setIsExpanded(window.innerWidth >= 768);
    };
    handleResize(); // Run on initial mount
    window.addEventListener("resize", handleResize);
    // Cleanup listener on component unmount.
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty dependency array ensures this runs only on mount and unmount.

  // Fetch USDC balance using wagmi's useBalance hook.
  const { data: usdcBalance, isLoading: isLoadingUsdcBalance } = useBalance({
    address,
    // Ensure chainId is defined before accessing USDC_ADDRESS map.
    token: chainId ? USDC_ADDRESS[chainId] : undefined,
    // Consider adding `query: { enabled: !!address && !!chainId }` if necessary
    // to prevent unnecessary fetches when address or chainId is missing.
  });

  // Memoize the formatted USDC balance to prevent recalculation on every render.
  // Only recalculates when usdcBalance object reference changes.
  const formattedUsdcBalance = useMemo(() => {
    if (!usdcBalance) return "0.00";
    // Ensure consistent two decimal places.
    return parseFloat(usdcBalance.formatted).toFixed(2);
  }, [usdcBalance]);

  // Memoize callback functions to open dialogs/forms.
  // Ensures stable references for these functions unless their dependencies change.
  const openShippingForm = useCallback((token: TokenInfo) => {
    setSelectedToken(token);
    setIsShippingOpen(true);
    setIsSelectorOpen(false); // Close selector when opening form
  }, []); // No dependencies, function doesn't rely on external state/props not already stable.

  const openPurchaseDialog = useCallback((token: TokenInfo) => {
    setSelectedToken(token);
    setIsPurchaseOpen(true);
    setIsSelectorOpen(false); // Close selector when opening dialog
  }, []); // No dependencies.

  // Memoized handler for selecting a token from the TokenSelectorDialog.
  // This function is passed down to TokenSelectorDialog. Memoization helps
  // if TokenSelectorDialog is memoized (e.g., with React.memo).
  const handleSelectToken = useCallback(
    (token: TokenInfo, action: "ship" | "purchase") => {
      if (action === "ship") {
        openShippingForm(token);
      } else {
        openPurchaseDialog(token);
      }
    },
    [openShippingForm, openPurchaseDialog] // Dependencies: ensure the handler updates if these callbacks change.
  );

  // Memoized handler for successful purchase.
  const handlePurchaseSuccess = useCallback((txHash: string) => {
    // TODO: Add user feedback for successful purchase (e.g., toast notification).
    console.log("Purchase successful, Tx Hash:", txHash);
    setIsPurchaseOpen(false);
    // Consider triggering a balance refresh here.
  }, []); // No dependencies.

  // Memoized handler for purchase errors.
  const handlePurchaseError = useCallback((error: Error) => {
    // TODO: Add user-friendly error feedback.
    console.error("Purchase error:", error);
    // Optionally close the dialog or keep it open for retry.
    // setIsPurchaseOpen(false);
  }, []); // No dependencies.

  // Memoized handler for toggling the expansion state.
  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []); // No dependencies.

  // Memoized handler for opening the token selector in 'purchase' mode.
  // Wrapped in useCallback for consistency and potential performance benefits
  // if passed to memoized components, though primarily used directly here.
  const openPurchaseSelector = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering expand/collapse if clicking button inside header.
    setSelectorMode("purchase");
    setIsSelectorOpen(true);
  }, []); // No dependencies.

  // Memoized handler for opening the token selector in 'ship' mode.
  const openShipSelector = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectorMode("ship");
    setIsSelectorOpen(true);
  }, []); // No dependencies.

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40",
        "md:bottom-4 md:left-4 md:right-auto", // Position adapts on medium screens
        "max-w-full w-full md:max-w-sm" // Limit width on larger screens
      )}
    >
      <div className="space-y-2">
        {/* Wrap lazy-loaded components in Suspense with a fallback. */}
        {/* Consider a more visually appealing fallback (e.g., a simple spinner) */}
        <Suspense fallback={<div>Loading...</div>}>
          {isSelectorOpen && (
            <TokenSelectorDialog
              isOpen={isSelectorOpen}
              onClose={() => setIsSelectorOpen(false)}
              onSelectToken={handleSelectToken}
              mode={selectorMode}
            />
          )}
          {selectedToken && address && isShippingOpen && (
            <ShippingForm
              isOpen={isShippingOpen}
              onClose={() => setIsShippingOpen(false)}
              address={address as `0x${string}`} // Type assertion needed as address can be undefined initially
              tokenAddress={selectedToken.address as `0x${string}`}
            />
          )}
          {selectedToken && isPurchaseOpen && (
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
        </Suspense>

        {/* Token Balance Summary Card */}
        <div
          className={cn(
            "bg-background/80", // Semi-transparent background
            "backdrop-blur-sm", // Frosted glass effect
            "border border-border", // Subtle border
            "rounded-t-md md:rounded-b-md md:rounded-t-md", // Adaptive rounding
            "overflow-hidden" // Clips content during collapse animation
          )}
        >
          {/* Clickable Header for Expand/Collapse */}
          <div
            className={cn(
              "p-3 flex justify-between items-center",
              "cursor-pointer", // Indicates interactivity
              "hover:bg-muted/20", // Subtle hover effect
              "transition-colors duration-150"
            )}
            onClick={toggleExpand} // Use memoized toggle function
          >
            <div className="flex items-center justify-between w-full gap-2">
              <h2 className="text-base md:text-lg font-bold text-accentGreen">
                Your Ammunition
              </h2>
              {/* Display USDC balance */}
              <div className="font-mono">
                {/* Consider showing a loading state while isLoadingUsdcBalance is true */}
                <span className="font-medium text-accentGreen">
                  ${formattedUsdcBalance}
                </span>{" "}
                USDC
              </div>
            </div>
            {/* Expand/Collapse Icon Button */}
            <button
              className={cn(
                "ml-2 p-1",
                "text-muted hover:text-foreground",
                "transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
              )}
              aria-label={isExpanded ? "Collapse panel" : "Expand panel"}
              // No onClick needed here as the parent div handles it.
              // Ensure this button doesn't interfere if it were focusable and space/enter was pressed.
              // Adding type="button" can be good practice.
              type="button"
            >
              <svg
                className={cn(
                  "w-5 h-5 transform transition-transform duration-200",
                  isExpanded ? "rotate-180" : "" // Rotate icon based on state
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

          {/* Collapsible Content Area */}
          {/* Headless UI Transition for smooth animation */}
          <Transition
            show={isExpanded}
            enter="transition-[max-height,opacity] duration-300 ease-out"
            enterFrom="max-h-0 opacity-0"
            enterTo="max-h-[60vh] opacity-100" // Use max-height based on viewport height
            leave="transition-[max-height,opacity] duration-200 ease-in"
            leaveFrom="max-h-[60vh] opacity-100"
            leaveTo="max-h-0 opacity-0"
          >
            {/* Inner container for border, padding, and scrolling */}
            <div
              className={cn(
                "overflow-y-auto", // Enable vertical scrolling if content exceeds max-height
                "border-t border-border", // Top border separates from header
                "max-h-[60vh]" // Explicit max-height matching transition
              )}
            >
              {/* Padding applied here to be part of the scrollable area */}
              <div className="p-3 pt-2">
                {/* Render token balances; pass memoized handler */}
                <TokenBalanceSummary onTokenAction={handleSelectToken} />
              </div>

              {/* Sticky Action Buttons Footer */}
              <div className="sticky bottom-0 p-3 border-t border-border bg-background/80 backdrop-blur-sm">
                <div className="flex flex-row justify-between gap-3">
                  {/* Buy Ammo Button */}
                  <Button
                    onClick={openPurchaseSelector} // Use memoized handler
                    variant="secondary"
                    className="flex-1" // Takes up half the space
                  >
                    Buy Ammo
                  </Button>

                  {/* Ship Ammo Button */}
                  <Button
                    onClick={openShipSelector} // Use memoized handler
                    variant="primary"
                    className="flex-1" // Takes up the other half
                  >
                    Ship Ammo
                  </Button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  );
};

export default ConnectedAccountTokenInfo;
