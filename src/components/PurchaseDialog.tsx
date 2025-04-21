import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
  CloseButton,
} from "@headlessui/react";
import { Fragment, useEffect, useState, useMemo } from "react";
import { USDC_ADDRESS } from "../addresses";
import { useAccount, useBalance, useChainId } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { FormInput } from "./FormInput";
import { useUniswapSwap } from "../hooks";
import { Button } from "./Button";

interface PurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tokenAddress: string;
  tokenName?: string;
  tokenSymbol?: string;
  onSuccess: (txHash: string) => void;
  onError: (error: Error) => void;
}

export const PurchaseDialog = ({
  isOpen,
  onClose,
  tokenAddress,
  tokenName = "AmmoToken",
  tokenSymbol = "AMMO",
  onSuccess,
  onError,
}: PurchaseDialogProps) => {
  // Get the current network
  const { chain, address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const chainId = chain?.id || 1; // Default to Ethereum Mainnet

  // Get USDC balance
  const { data: usdcBalance } = useBalance({
    address,
    token: USDC_ADDRESS[chainId],
  });

  // Format USDC balance for display
  const formattedUsdcBalance = useMemo(() => {
    if (!usdcBalance) return "0.00";
    return parseFloat(usdcBalance.formatted).toFixed(2);
  }, [usdcBalance]);

  // Use our consolidated Uniswap hook
  const { state, getQuote, swap } = useUniswapSwap(chainId ?? 1);

  // Form state - only need USDC amount
  const [amount, setAmount] = useState("");

  // Hardcoded slippage to 5% (hidden from user)
  const SLIPPAGE_PERCENTAGE = 5;

  // Shipping and handling fee (10% of transaction amount)
  const SHIPPING_FEE_PERCENTAGE = 10;

  // Get USDC address for the current chain
  const usdcAddress = USDC_ADDRESS[chainId] || "";

  // Calculate shipping fee
  const shippingFee =
    amount && parseFloat(amount) > 0
      ? ((parseFloat(amount) * SHIPPING_FEE_PERCENTAGE) / 100).toFixed(2)
      : "0.00";

  // Calculate total cost
  const totalCost =
    amount && parseFloat(amount) > 0
      ? (parseFloat(amount) + parseFloat(shippingFee)).toFixed(2)
      : "0.00";

  // Handle getting a quote when amount changes
  useEffect(() => {
    const fetchQuote = async () => {
      if (!amount || parseFloat(amount) <= 0) return;

      try {
        await getQuote({
          tokenIn: usdcAddress,
          tokenOut: tokenAddress,
          amount,
          slippagePercentage: SLIPPAGE_PERCENTAGE,
        });
      } catch (error) {
        console.error("Error getting quote:", error);
        if (onError && error instanceof Error) onError(error);
      }
    };

    fetchQuote();
  }, [amount, getQuote, tokenAddress, usdcAddress, onError]);

  // Handle transaction success
  useEffect(() => {
    if (state.txHash && onSuccess) {
      onSuccess(state.txHash);
    }
  }, [state.txHash, onSuccess]);

  // Handle transaction error
  useEffect(() => {
    if (state.error && onError) {
      onError(state.error);
    }
  }, [state.error, onError]);

  // Handle executing a swap
  const handleSwap = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid USDC amount");
      return;
    }

    try {
      await swap({
        tokenIn: usdcAddress,
        tokenOut: tokenAddress,
        amount: totalCost, // Use total cost including shipping fee
        slippagePercentage: SLIPPAGE_PERCENTAGE,
      });
    } catch (error) {
      console.error("Error executing swap:", error);
      if (onError && error instanceof Error) onError(error);
    }
  };

  // Handle button click based on connection status
  const handleButtonClick = () => {
    if (!isConnected) {
      openConnectModal?.();
    } else {
      handleSwap();
    }
  };
  const estimatedDelivery = "2-4 weeks";

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild as={Fragment}>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition duration-300 data-[closed]:opacity-0"
            aria-hidden="true"
          />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-3 md:p-4">
          <TransitionChild as={Fragment}>
            <DialogPanel className="w-full max-w-sm md:max-w-md transform overflow-hidden rounded-none bg-background border border-border p-4 md:p-6 transition-all duration-300 ease-out data-[closed]:opacity-0 data-[closed]:scale-95">
              <div className="flex justify-between items-center mb-4">
                <DialogTitle
                  as="h3"
                  className="text-lg font-mono font-bold text-accentGreen"
                >
                  Purchase {tokenSymbol}
                </DialogTitle>
                <CloseButton
                  className="text-muted hover:text-foreground focus:outline-none"
                  aria-label="Close"
                >
                  <svg
                    className="h-5 w-5"
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
                </CloseButton>
              </div>

              <div className="flex flex-col w-full space-y-3">
                <p className="text-xs text-muted w-full">{tokenName}</p>

                <div className="w-full space-y-3">
                  <div className="bg-muted/10 p-2 rounded-none border border-border">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted">
                        Your USDC Balance:
                      </span>
                      <span className="text-xs font-mono font-medium text-foreground">
                        ${formattedUsdcBalance}
                      </span>
                    </div>
                  </div>

                  <div className="relative">
                    <FormInput
                      label="Purchase Amount (USDC)"
                      id="amount-input"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="pr-12 text-xs font-mono"
                    />
                    <span className="absolute right-3 bottom-2 text-xs text-muted">
                      USDC
                    </span>
                  </div>

                  <div className="border border-border rounded-none overflow-hidden">
                    <div className="bg-muted/10 px-3 py-1.5 border-b border-border">
                      <h3 className="font-medium text-xs font-mono text-foreground">
                        Order Summary
                      </h3>
                    </div>

                    <div className="p-2.5 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted">Subtotal</span>
                        <span className="font-mono font-medium text-foreground">
                          {amount || "0.00"} USDC
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted">
                          Shipping ({SHIPPING_FEE_PERCENTAGE}%)
                        </span>
                        <span className="font-mono font-medium text-foreground">
                          {shippingFee} USDC
                        </span>
                      </div>

                      <div className="border-t border-border my-1 pt-1"></div>

                      <div className="flex justify-between">
                        <span className="font-medium font-mono text-foreground">
                          Total
                        </span>
                        <span className="font-bold font-mono text-foreground">
                          {totalCost} USDC
                        </span>
                      </div>

                      {state.quote && (
                        <div className="flex justify-between pt-1 border-t border-border">
                          <span className="text-muted">You receive (est.)</span>
                          <span className="font-mono font-medium text-accentGreen">
                            {state.quote.outputAmount} {tokenSymbol}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-muted/10 p-2 rounded-none text-xs border border-border">
                    <div className="flex items-center gap-1 text-muted font-medium mb-0.5">
                      <svg
                        className="w-4 h-4 text-muted flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                        />
                      </svg>
                      <span className="font-mono">Shipping Info</span>
                    </div>
                    <p className="text-muted pl-5">
                      Est. delivery:{" "}
                      <span className="font-medium text-foreground font-mono">
                        {estimatedDelivery}
                      </span>
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleButtonClick}
                    disabled={
                      isConnected &&
                      (state.loading ||
                        !amount ||
                        !state.quote ||
                        parseFloat(amount) <= 0)
                    }
                  >
                    {!isConnected ? (
                      "Connect Wallet"
                    ) : state.loading ? (
                      <div className="flex items-center justify-center">
                        <svg
                          className="animate-spin h-4 w-4 mr-2 text-accentGreen"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            d="M12 2 L12 5 M12 19 L12 22 M5 12 L2 12 M22 12 L19 12 M19.07 4.93 L16.95 7.05 M7.05 16.95 L4.93 19.07 M19.07 19.07 L16.95 16.95 M7.05 7.05 L4.93 4.93"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="font-mono">Processing...</span>
                      </div>
                    ) : (
                      `Complete Purchase`
                    )}
                  </Button>

                  {state.error && (
                    <div className="bg-destructive/10 text-destructive p-2 rounded-none text-xs border border-destructive">
                      {state.error.message}
                    </div>
                  )}

                  {state.txHash && (
                    <div className="bg-accentGreen/10 text-accentGreen p-2 rounded-none text-xs border border-accentGreen">
                      <p className="font-medium font-mono">Order Confirmed!</p>
                      <a
                        href={`https://${
                          chain?.name?.toLowerCase().includes("base")
                            ? "basescan.org"
                            : "sepolia.etherscan.io"
                        }/tx/${state.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground underline font-mono"
                      >
                        View Transaction
                      </a>
                    </div>
                  )}

                  <p className="text-xs text-muted text-center mt-2">
                    By completing this purchase, you agree to our Terms of
                    Service and acknowledge that physical redemption is subject
                    to verification and applicable regulations.
                  </p>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};
