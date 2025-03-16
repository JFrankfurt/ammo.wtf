import React, { useState, useEffect, useMemo } from "react";
import { useUniswap } from "../hooks";
import { useAccount, useBalance } from "wagmi";
import { USDC_ADDRESS } from "../addresses";
import { FormInput } from "./FormInput";
import { useConnectModal } from "@rainbow-me/rainbowkit";

interface UniswapSwapProps {
  tokenAddress: string; // The token address that the component was opened from
  tokenName?: string; // Optional token name for display
  tokenSymbol?: string; // Optional token symbol for display
  onSuccess?: (txHash: string) => void; // Callback when swap is successful
  onError?: (error: Error) => void; // Callback when swap fails
}

export function UniswapSwap({
  tokenAddress,
  tokenName = "AmmoToken",
  tokenSymbol = "AMMO",
  onSuccess,
  onError,
}: UniswapSwapProps) {
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
  const { state, getQuote, swap } = useUniswap(chainId);

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

  // Estimated delivery time (2-4 weeks)
  const estimatedDelivery = "2-4 weeks";

  return (
    <div className="bg-white space-y-5 mt-4">
      {/* Remove the title since it's now in the Dialog */}
      {/* <h2 className="text-xl font-bold mb-2">Purchase {tokenSymbol}</h2> */}
      <p className="text-sm text-gray-600">{tokenName}</p>

      <div className="space-y-4">
        {/* USDC Balance Display */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Your USDC Balance:</span>
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
            className="pr-12"
          />
          <span className="absolute right-3 bottom-3 text-gray-500">USDC</span>
        </div>

        {/* Order Summary - Compact Version */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 border-b">
            <h3 className="font-medium text-sm text-gray-900">Order Summary</h3>
          </div>

          <div className="p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{amount || "0.00"} USDC</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">
                Shipping ({SHIPPING_FEE_PERCENTAGE}%)
              </span>
              <span className="font-medium">{shippingFee} USDC</span>
            </div>

            <div className="border-t my-1 pt-1"></div>

            <div className="flex justify-between">
              <span className="font-medium text-gray-900">Total</span>
              <span className="font-bold text-gray-900">{totalCost} USDC</span>
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
        <div className="bg-blue-50 p-3 rounded-lg text-sm">
          <div className="flex items-center gap-1 text-blue-800 font-medium mb-1">
            <svg
              className="w-4 h-4"
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
          <p className="text-xs text-blue-700 mb-1">
            Estimated delivery:{" "}
            <span className="font-medium">{estimatedDelivery}</span>
          </p>
        </div>

        {/* Action Button */}
        <button
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
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
              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
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
          <div className="bg-red-50 text-red-700 p-2 rounded-lg text-xs">
            {state.error.message}
          </div>
        )}

        {state.txHash && (
          <div className="bg-green-50 text-green-700 p-2 rounded-lg text-xs">
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
        <p className="text-xs text-gray-500 text-center mt-2">
          By completing this purchase, you agree to our Terms of Service and
          acknowledge that physical redemption is subject to verification and
          applicable regulations.
        </p>
      </div>
    </div>
  );
}
