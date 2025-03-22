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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition duration-300 data-[closed]:opacity-0"
            aria-hidden="true"
          />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-3 md:p-4">
          <TransitionChild as={Fragment}>
            <DialogPanel className="w-full max-w-sm md:max-w-md transform overflow-hidden rounded-xl md:rounded-2xl bg-white p-4 md:p-6 shadow-xl transition-all duration-300 ease-out data-[closed]:opacity-0 data-[closed]:scale-95">
              <div className="flex justify-between items-center">
                <DialogTitle
                  as="h3"
                  className="text-base md:text-lg font-medium leading-6 text-gray-900"
                >
                  Purchase Ammo Tokens
                </DialogTitle>
                <CloseButton
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
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

              <div className="mt-1 md:mt-2">
                <div className="flex flex-col items-center justify-start w-full max-w-md md:max-w-lg lg:max-w-xl mx-auto p-3 md:p-4 lg:p-6 space-y-4">
                  <p className="text-sm text-gray-600 w-full">{tokenName}</p>

                  <div className="w-full space-y-2 md:space-y-3">
                    {/* USDC Balance Display */}
                    <div className="bg-blue-50 p-2.5 md:p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">
                          Your USDC Balance:
                        </span>
                        <span className="font-medium text-blue-700">
                          ${formattedUsdcBalance}
                        </span>
                      </div>
                    </div>

                    {/* Input Section */}
                    <div className="relative">
                      <FormInput
                        label="Purchase Amount"
                        id="amount-input"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="pr-12 text-base md:text-lg"
                      />
                      <span className="absolute right-3 bottom-3 text-gray-500">
                        USDC
                      </span>
                    </div>

                    {/* Order Summary - Compact Version */}
                    <div className="border rounded-lg md:rounded-xl overflow-hidden">
                      <div className="bg-gray-50 px-3 py-2 border-b">
                        <h3 className="font-medium text-sm md:text-base text-gray-900">
                          Order Summary
                        </h3>
                      </div>

                      <div className="p-2.5 md:p-3 space-y-2 text-sm md:text-base">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-medium">
                            {amount || "0.00"} USDC
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Shipping ({SHIPPING_FEE_PERCENTAGE}%)
                          </span>
                          <span className="font-medium">
                            {shippingFee} USDC
                          </span>
                        </div>

                        <div className="border-t my-1 pt-1"></div>

                        <div className="flex justify-between">
                          <span className="font-medium text-gray-900">
                            Total
                          </span>
                          <span className="font-bold text-gray-900">
                            {totalCost} USDC
                          </span>
                        </div>

                        {state.quote && (
                          <div className="flex justify-between pt-1 border-t">
                            <span className="text-gray-600">You receive</span>
                            <span className="font-medium text-green-700">
                              {state.quote.outputAmount} {tokenSymbol}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Shipping Information - Compact */}
                    <div className="bg-blue-50 p-2.5 md:p-3 rounded-lg text-sm md:text-base">
                      <div className="flex items-center gap-1 text-blue-800 font-medium mb-1">
                        <svg
                          className="w-4 h-4 md:w-5 md:h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Shipping Info</span>
                      </div>
                      <p className="text-xs md:text-sm text-blue-700 mb-1">
                        Estimated delivery:{" "}
                        <span className="font-medium">{estimatedDelivery}</span>
                      </p>
                    </div>

                    {/* Action Button */}
                    <button
                      className="w-full bg-blue-600 text-white py-2.5 md:py-3 px-4 rounded-lg md:rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm md:text-base"
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
                            className="animate-spin h-4 w-4 md:h-5 md:w-5 mr-2"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Processing...
                        </div>
                      ) : (
                        `Complete Purchase`
                      )}
                    </button>

                    {/* Status Messages */}
                    {state.error && (
                      <div className="bg-red-50 text-red-700 p-2.5 md:p-3 rounded-lg text-xs md:text-sm">
                        {state.error.message}
                      </div>
                    )}

                    {state.txHash && (
                      <div className="bg-green-50 text-green-700 p-2.5 md:p-3 rounded-lg text-xs md:text-sm">
                        <p className="font-medium">Order Confirmed!</p>
                        <a
                          href={`https://${
                            chain?.name?.toLowerCase().includes("base")
                              ? "basescan.org"
                              : "sepolia.etherscan.io"
                          }/tx/${state.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-800 underline"
                        >
                          View Transaction
                        </a>
                      </div>
                    )}

                    {/* Terms and Conditions */}
                    <p className="text-xs md:text-sm text-gray-500 text-center mt-2">
                      By completing this purchase, you agree to our Terms of
                      Service and acknowledge that physical redemption is
                      subject to verification and applicable regulations.
                    </p>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};
