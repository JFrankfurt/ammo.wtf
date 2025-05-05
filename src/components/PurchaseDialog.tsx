import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
  CloseButton,
} from "@headlessui/react";
import { Fragment, useState, useMemo } from "react";
import { useAccount, useBalance, useChainId } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Address, BaseError, formatUnits } from "viem";
import { FormInput } from "./FormInput";
import { Button } from "./Button";
import { OrderSummary } from "./OrderSummary";
import { usePurchaseCalculations } from "../hooks/usePurchaseCalculations";
import { usePurchaseSwap } from "../hooks/usePurchaseSwap";
import { USDC_ADDRESS } from "../addresses";
import { useDebounceValue } from "usehooks-ts";
import { useQuoter } from "../hooks/useQuoter";
import { logger } from "@/utils/logger";
interface PurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tokenAddress: Address;
  tokenName?: string;
  tokenSymbol?: string;
  onSuccess: (txHash: string) => void;
  onError: (error: Error) => void;
}

const SLIPPAGE_PERCENTAGE = 5;
const SHIPPING_FEE_PERCENTAGE = 10;
const ESTIMATED_DELIVERY = "2-4 weeks";

export const PurchaseDialog = ({
  isOpen,
  onClose,
  tokenAddress,
  tokenName = "AmmoToken",
  tokenSymbol = "AMMO",
  onSuccess,
  onError,
}: PurchaseDialogProps) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { openConnectModal } = useConnectModal();
  const [amount, setAmount] = useState("");
  const [debouncedAmount] = useDebounceValue(amount, 500);

  const usdcTokenAddress = useMemo(
    () => USDC_ADDRESS[chainId] || "",
    [chainId]
  );
  const { data: usdcBalance } = useBalance({
    address,
    token: usdcTokenAddress,
    chainId: chainId,
    query: {
      enabled: isConnected && !!usdcTokenAddress,
    },
  });

  const formattedUsdcBalance = useMemo(() => {
    if (!usdcBalance) return "0.00";
    return parseFloat(usdcBalance.formatted).toFixed(2);
  }, [usdcBalance]);

  const { subtotal, shippingFee, totalCost, parsedAmount } =
    usePurchaseCalculations({
      amount: debouncedAmount,
      shippingFeePercentage: SHIPPING_FEE_PERCENTAGE,
    });

  const isSwapEnabled =
    isConnected && !!usdcTokenAddress && !!tokenAddress && parsedAmount > 0;

  const { data: quoteData, isLoading } = useQuoter({
    tokenOutAddress: tokenAddress,
    amountIn: debouncedAmount,
    enabled: isSwapEnabled,
  });

  const quotedOutputAmount = formatUnits(
    ((quoteData as [bigint, bigint]) || [0n, 0n])[0],
    18
  );

  logger.info("quoteData", quoteData);

  // const { swapState, executeSwap } = usePurchaseSwap({
  //   amountUSDC: debouncedAmount,
  //   totalCostUSDC: totalCost,
  //   parsedAmountUSDC: parsedAmount,
  //   tokenOutAddress: tokenAddress,
  //   slippagePercentage: SLIPPAGE_PERCENTAGE,
  //   chainId: chainId,
  //   onSuccess: onSuccess,
  //   onError: onError,
  //   enabled: isSwapEnabled,
  // });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleButtonClick = () => {
    if (!isConnected) {
      openConnectModal?.();
    } else if (isSwapEnabled) {
      // executeSwap();
    } else {
      console.warn("Swap button clicked but conditions not met.");
    }
  };

  const isButtonDisabled = isConnected; // && (!isSwapEnabled || swapState.loading || !swapState.quote);

  // const explorerUrl = useMemo(() => {
  //   const baseUrl = chainId === 8453 ? "basescan.org" : "sepolia.etherscan.io";
  //   return swapState.txHash ? `https://${baseUrl}/tx/${swapState.txHash}` : "#";
  // }, [chainId, swapState.txHash]);

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
              <div className="flex justify-between items-start mb-3">
                <div className="flex-grow">
                  <DialogTitle
                    as="h3"
                    className="text-lg font-mono font-bold text-accentGreen"
                  >
                    Purchase {tokenSymbol}
                  </DialogTitle>
                </div>
                <CloseButton
                  className="text-muted hover:text-foreground focus:outline-none ml-2 flex-shrink-0"
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
                  <div className="relative">
                    <div className="flex justify-between items-center mb-0.5">
                      <label
                        htmlFor="amount-input"
                        className="block text-xs font-medium text-muted"
                      >
                        Purchase Amount (USDC)
                      </label>
                      {isConnected && (
                        <div className="text-xs text-muted">
                          <span>Balance: </span>
                          <span className="font-mono font-medium text-foreground">
                            ${formattedUsdcBalance}
                          </span>
                        </div>
                      )}
                    </div>
                    <FormInput
                      id="amount-input"
                      type="number"
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="pr-12 text-xs font-mono"
                    />
                    <span className="absolute right-3 bottom-2 text-xs text-muted">
                      USDC
                    </span>
                  </div>

                  <OrderSummary
                    subtotal={subtotal}
                    shippingFee={shippingFee}
                    totalCost={totalCost}
                    shippingFeePercentage={SHIPPING_FEE_PERCENTAGE}
                    estimatedOutputAmount={quotedOutputAmount}
                    outputTokenSymbol={tokenSymbol}
                    currencySymbol="USDC"
                  />

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
                      <p className="text-muted">
                        Est. delivery:{" "}
                        <span className="font-medium text-foreground font-mono">
                          {ESTIMATED_DELIVERY}
                        </span>
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleButtonClick}
                    disabled={isButtonDisabled}
                  >
                    {!isConnected ? "Connect Wallet" : `Complete Purchase`}
                  </Button>
                  {/* 
                  {swapState.error && (
                    <div className="bg-destructive/10 text-destructive p-2 rounded-none text-xs border border-destructive space-y-1 max-h-32 overflow-y-auto">
                      <p className="font-medium">Transaction Failed</p>
                      <p className="font-mono break-words">
                        Reason:{" "}
                        {swapState.error instanceof BaseError
                          ? swapState.error.shortMessage
                          : swapState.error.message}
                      </p>
                    </div>
                  )}

                  {swapState.txHash && (
                    <div className="bg-accentGreen/10 text-accentGreen p-2 rounded-none text-xs border border-accentGreen">
                      <p className="font-medium font-mono">Order Confirmed!</p>
                      <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground underline font-mono"
                      >
                        View Transaction
                      </a>
                    </div>
                  )} */}

                  <p className="text-xs text-muted text-center mt-2">
                    You agree to our Terms of Service and acknowledge that
                    shipments are subject to your local regulations.
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
