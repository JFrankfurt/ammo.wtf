"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useState } from "react";
import { useReadContract } from "wagmi";
import { default as erc20Abi } from "../abi/ammoTokenERC20";
import { UniswapSwap } from "./PurchaseAmmoDialog";

export interface Token {
  address: `0x${string}`;
  symbol: string;
  priceUsd: number;
}

export const TokenBalanceInfo = ({
  address,
  symbol,
  accountAddress,
}: Token & { accountAddress: `0x${string}` }) => {
  const { data: balance } = useReadContract({
    address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [accountAddress],
  });

  const [isSwapOpen, setIsSwapOpen] = useState(false);

  const formattedBalance = balance ? Number(balance) / Math.pow(10, 18) : 0;

  return (
    <>
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-lg font-medium">{symbol}</div>
            <div className="text-sm text-gray-500">
              {formattedBalance > 0 ? (
                `${formattedBalance.toLocaleString()} rounds available to ship`
              ) : (
                <span className="text-gray-400">No rounds in inventory</span>
              )}
            </div>
          </div>

          <button
            onClick={() => setIsSwapOpen(true)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            <span>Buy Now</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </button>
        </div>

        {formattedBalance === 0 && (
          <div className="mt-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Purchase tokens to enable shipping</span>
            </div>
          </div>
        )}
      </div>

      {/* Purchase Dialog */}
      <Dialog
        open={isSwapOpen}
        onClose={() => setIsSwapOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 flex w-screen items-center justify-center">
          <DialogPanel className="max-w-md w-full bg-white px-6 py-4 rounded-lg shadow-xl">
            <div className="flex justify-between items-center">
              <DialogTitle className="font-bold text-2xl">
                Buy {symbol}
              </DialogTitle>
              <button
                onClick={() => setIsSwapOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-5 h-5"
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
              </button>
            </div>
            <UniswapSwap
              onSuccess={(hash) => {
                setIsSwapOpen(false);
              }}
              onError={(error) => {
                console.error("Swap error:", error);
              }}
              tokenAddress={address}
            />
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
};
