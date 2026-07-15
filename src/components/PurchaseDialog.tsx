import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
  CloseButton,
} from "@headlessui/react";
import { Fragment, useState } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Address } from "viem";
import { FormInput } from "./FormInput";
import { Button } from "./Button";
import { OrderSummary } from "./OrderSummary";
import { TransactionStatus } from "./TransactionStatus";
import { useDebounceValue } from "usehooks-ts";
import { useSepoliaPurchase } from "@/hooks/useSepoliaPurchase";

interface PurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tokenAddress: Address;
  tokenName?: string;
  tokenSymbol?: string;
}

const SLIPPAGE_BPS = 500;
const SHIPPING_FEE_PERCENTAGE = 10;
const ESTIMATED_DELIVERY = "2-4 weeks";

export const PurchaseDialog = ({
  isOpen,
  onClose,
  tokenAddress,
  tokenName = "AmmoToken",
  tokenSymbol = "AMMO",
}: PurchaseDialogProps) => {
  const { isConnected, chainId } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [amount, setAmount] = useState("");
  const [debouncedAmount] = useDebounceValue(amount, 500);
  const purchase = useSepoliaPurchase({
    subtotalInput: debouncedAmount,
    tokenOut: tokenAddress,
    slippageBps: SLIPPAGE_BPS,
    enabled: isOpen,
  });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleButtonClick = async () => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }
    await purchase.executePurchase().catch(() => undefined);
  };

  const isTransactionPending =
    purchase.status === "approving-erc20" ||
    purchase.status === "approving-permit2" ||
    purchase.status === "swapping";

  const disabledReasonText =
    purchase.disabledReason === "Insufficient USDC balance."
      ? `Insufficient balance: purchase requires ${purchase.amounts.total} USDC.`
      : purchase.disabledReason === "Switch to Sepolia to purchase."
        ? "Purchases support Sepolia only. Switch networks in your wallet."
        : purchase.disabledReason === "Enter a purchase amount." ||
            purchase.disabledReason === "Waiting for quote." ||
            purchase.disabledReason === "Transaction in progress."
          ? null // transient/self-evident states covered by button label + status line
          : purchase.disabledReason;

  const statusMessage: Partial<Record<typeof purchase.status, string>> = {
    quoting: "Fetching exact-input quote…",
    "approving-erc20": "Approving exact USDC amount for Permit2…",
    "approving-permit2":
      "Approving exact Permit2 amount for Universal Router…",
    swapping: "Submitting swap and waiting for confirmation…",
    success: "Purchase confirmed.",
  };
  const transactionStatus = purchase.error
    ? "error"
    : purchase.status === "success"
      ? "success"
      : statusMessage[purchase.status]
        ? "pending"
        : "idle";

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
                            {purchase.usdcBalanceFormatted} USDC
                          </span>
                        </div>
                      )}
                    </div>
                    <FormInput
                      id="amount-input"
                      type="number"
                      value={amount}
                      onChange={handleAmountChange}
                      disabled={isTransactionPending}
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
                    subtotal={purchase.amounts.subtotal}
                    shippingFee={purchase.amounts.fee}
                    totalCost={purchase.amounts.total}
                    shippingFeePercentage={SHIPPING_FEE_PERCENTAGE}
                    estimatedOutputAmount={purchase.quoteFormatted ?? undefined}
                    outputTokenSymbol={tokenSymbol}
                    currencySymbol="USDC"
                  />

                  {isConnected && disabledReasonText && (
                    <p className="text-xs text-accentRed">
                      {disabledReasonText}
                    </p>
                  )}

                  <TransactionStatus
                    status={transactionStatus}
                    message={statusMessage[purchase.status]}
                    error={purchase.error}
                    hash={purchase.txHash}
                    chainId={chainId}
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
                    disabled={isConnected && !purchase.canPurchase}
                  >
                    {!isConnected
                      ? "Connect Wallet"
                      : purchase.status === "approving-erc20" ||
                        purchase.status === "approving-permit2"
                      ? "Awaiting Approval"
                      : purchase.status === "swapping"
                      ? "Completing Purchase"
                      : "Complete Purchase"}
                  </Button>

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
