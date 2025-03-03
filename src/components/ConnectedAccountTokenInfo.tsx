"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { z } from "zod";
import {
  default as ammoTokenABI,
  default as erc20Abi,
} from "../abi/ammoTokenERC20";
import { TEST_556_TOKEN_ADDRESS, USDC_ADDRESS } from "../addresses";
import { getShipperPublicKey } from "../data/shipper-keys";
import {
  encryptData,
  encryptSymmetricKey,
  generateSymmetricKey,
} from "../data/shipping-encryption";
import { shippingSchema } from "../data/shipping-validation";
import { Button } from "./Button";
import { TransactionStates } from "./TransactionStates";
import { base } from "viem/chains";
import { uniswapChainStringNames } from "../utils/chainInfo";

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
  const { chainId } = useAccount();
  const { data: balance } = useReadContract({
    address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [accountAddress],
  });

  const chainStringName = uniswapChainStringNames[chainId ?? base.id];

  const formattedBalance = balance ? Number(balance) / Math.pow(10, 18) : 0;
  const uniswapUrl = `https://app.uniswap.org/swap?chain=${chainStringName}&inputCurrency=${
    USDC_ADDRESS[chainId ?? base.id]
  }&outputCurrency=${address}`;

  return (
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

        <a
          href={uniswapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          <span>Buy on Uniswap</span>
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
        </a>
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
  );
};

export const ShippingForm = ({
  isOpen,
  onClose,
  address,
  tokenAddress,
}: {
  isOpen: boolean;
  onClose: () => void;
  address: `0x${string}`;
  tokenAddress: `0x${string}`;
}) => {
  const { chainId } = useAccount();
  const [step, setStep] = useState<"contents" | "shipping">("contents");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      orderId: "",
      recipient: {
        name: "",
        email: "",
        phone: "",
      },
      address: {
        street1: "",
        street2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "US" as const,
      },
      preferences: {
        requireSignature: true,
        insurance: true,
        specialInstructions: "",
      },
      metadata: {
        version: "1.0" as const,
        origin: "marketplace-v1",
      },
    },
  });

  const { data: balance556 } = useReadContract({
    address: TEST_556_TOKEN_ADDRESS[chainId ?? base.id]
      .address as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address],
  });

  const formattedBalance556 = balance556
    ? Number(balance556) / Math.pow(10, 18)
    : 0;

  const balances = [
    {
      token: TEST_556_TOKEN_ADDRESS[chainId ?? base.id],
      symbol: "TEST 5.56",
      balance: formattedBalance556,
      priceUsd: 0.3,
    },
  ];

  const handleQuantityChange = (address: string, value: number) => {
    setQuantities((prev) => ({
      ...prev,
      [address]: value,
    }));
  };

  const totalTokens = Object.entries(quantities).reduce(
    (sum, [_address, qty]) => sum + qty * 250,
    0
  );

  // todo: rewrite to use hardcoded token addresses list from addresses.ts
  const totalValueUsd = Object.entries(quantities).reduce(
    (sum, [address, qty]) => {
      const token = balances.find((t) => t.token.address === address);
      return sum + (token?.priceUsd ?? 0.3) * qty * 250;
    },
    0
  );

  const hasSelectedQuantities = Object.values(quantities).some(
    (qty) => qty > 0
  );

  const {
    writeContract,
    isError,
    error: writeContractError,
    data: hash,
    isPending,
  } = useWriteContract();

  const { chain } = useAccount();

  const onSubmit = async (data: z.infer<typeof shippingSchema>) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Prepare shipping data
      const shippingData = {
        ...data,
        metadata: {
          version: "1.0",
          origin: "marketplace-v1",
        },
        quantity: totalTokens,
      };

      const shipperPublicKey = await getShipperPublicKey();
      const aesKey = await generateSymmetricKey();
      const encryptedKeyData = await encryptSymmetricKey(
        aesKey,
        shipperPublicKey
      );

      // Encrypt shipping data
      const { encryptedData, iv } = await encryptData(
        JSON.stringify(shippingData),
        aesKey
      );

      // Convert the encrypted package to a single bytes string
      const encryptedPackageBytes = new Uint8Array([
        ...iv,
        ...encryptedData,
        ...encryptedKeyData.ephemeralPubKey,
        ...encryptedKeyData.encryptedSymmetricKey,
      ]);

      // Submit to blockchain
      writeContract(
        {
          abi: ammoTokenABI,
          address: tokenAddress,
          functionName: "redeem",
          args: [
            address as `0x${string}`,
            parseUnits(totalTokens.toString(), 18),
            `0x${Buffer.from(encryptedPackageBytes).toString(
              "hex"
            )}` as `0x${string}`,
          ],
        },
        {
          onSettled: () => {
            setIsSubmitting(false);
          },
        }
      );

      // Don't reset form here - wait for confirmation
    } catch (error) {
      console.error("Error submitting shipping form:", error);
      setError(
        error instanceof Error &&
          (error.message.includes("User denied") ||
            error.message.includes("user rejected"))
          ? "Transaction was rejected"
          : "An unexpected error occurred while submitting your shipping information."
      );
    }
  };

  // Optional: Watch for transaction completion
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: hash,
    });

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 flex w-screen items-center justify-center">
        <DialogPanel className="max-w-4xl space-y-4 border bg-white px-6 py-4">
          <DialogTitle className="font-bold text-2xl">Ship Ammo</DialogTitle>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
              {error}
            </div>
          )}

          {step === "contents" ? (
            <div className="space-y-4">
              <div className="hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Ammo</th>
                      <th className="text-right p-2">Available Rounds</th>
                      <th className="text-right p-2">Packages</th>
                      <th className="text-right p-2">Round Count</th>
                      <th className="text-right p-2">Price per Round</th>
                      <th className="text-right p-2">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balances.map(({ token, balance, priceUsd, symbol }) => {
                      const maxUnits = balance / 250;
                      const quantity = quantities[token.address] || 0;
                      const value = quantity * 250 * priceUsd;

                      return (
                        <tr key={token.address}>
                          <td className="p-2">{symbol}</td>
                          <td className="text-right p-2">
                            {balance.toString()}
                          </td>
                          <td className="text-right p-2">
                            <select
                              className="border p-1"
                              value={quantity}
                              onChange={(e) =>
                                handleQuantityChange(
                                  token.address,
                                  Number(e.target.value)
                                )
                              }
                            >
                              <option value={0}>0</option>
                              {Array.from(
                                { length: Math.floor(maxUnits) },
                                (_, i) => (
                                  <option key={i + 1} value={i + 1}>
                                    {i + 1}
                                  </option>
                                )
                              )}
                            </select>
                          </td>
                          <td className="text-right p-2">{quantity * 250}</td>
                          <td className="text-right p-2">${priceUsd}</td>
                          <td className="text-right p-2">
                            ${value.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="font-bold">
                      <td colSpan={5} className="text-right p-2">
                        Total Value:
                      </td>
                      <td className="text-right p-2">
                        ${totalValueUsd.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Card layout for mobile */}
              <div className="md:hidden space-y-4">
                {balances.map(({ token, balance, priceUsd, symbol }) => {
                  const maxUnits = balance / 250;
                  const quantity = quantities[token.address] || 0;
                  const value = quantity * 250 * priceUsd;

                  return (
                    <div
                      key={token.address}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="font-bold text-lg">{symbol}</div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Available Rounds:</div>
                        <div className="text-right">{balance.toString()}</div>

                        <div>Packages:</div>
                        <div className="text-right">
                          <select
                            className="border p-1 w-20"
                            value={quantity}
                            onChange={(e) =>
                              handleQuantityChange(
                                token.address,
                                Number(e.target.value)
                              )
                            }
                          >
                            <option value={0}>0</option>
                            {Array.from(
                              { length: Math.floor(maxUnits) },
                              (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                  {i + 1}
                                </option>
                              )
                            )}
                          </select>
                        </div>

                        <div>Round Count:</div>
                        <div className="text-right">{quantity * 250}</div>

                        <div>Price per Round:</div>
                        <div className="text-right">${priceUsd}</div>

                        <div className="font-semibold">Value:</div>
                        <div className="text-right font-semibold">
                          ${value.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="pt-4 font-bold text-lg flex justify-between">
                  <span>Total Value:</span>
                  <span>${totalValueUsd.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setStep("shipping")}
                  disabled={!hasSelectedQuantities}
                  variant="primary"
                >
                  Next
                </Button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit, onError)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <div>
                  <input
                    {...register("recipient.name")}
                    className="w-full border p-2"
                    placeholder="Full Name"
                  />
                  {errors.recipient?.name && (
                    <p className="text-red-500 text-sm">
                      {errors.recipient.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    {...register("recipient.email")}
                    type="email"
                    className="w-full border p-2"
                    placeholder="Email"
                  />
                  {errors.recipient?.email && (
                    <p className="text-red-500 text-sm">
                      {errors.recipient.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    {...register("recipient.phone")}
                    className="w-full border p-2"
                    placeholder="Phone Number"
                    type="tel"
                  />
                  {errors.recipient?.phone && (
                    <p className="text-red-500 text-sm">
                      {errors.recipient.phone.message}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    {...register("address.street1")}
                    className="w-full border p-2"
                    placeholder="Street Address"
                  />
                  {errors.address?.street1 && (
                    <p className="text-red-500 text-sm">
                      {errors.address.street1.message}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    {...register("address.city")}
                    className="w-full border p-2"
                    placeholder="City"
                  />
                  {errors.address?.city && (
                    <p className="text-red-500 text-sm">
                      {errors.address.city.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      {...register("address.state")}
                      className="w-full border p-2"
                      placeholder="State"
                    />
                    {errors.address?.state && (
                      <p className="text-red-500 text-sm">
                        {errors.address.state.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <input
                      {...register("address.postalCode")}
                      className="w-full border p-2"
                      placeholder="Postal Code"
                    />
                    {errors.address?.postalCode && (
                      <p className="text-red-500 text-sm">
                        {errors.address.postalCode.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <input
                    {...register("address.country")}
                    type="hidden"
                    value="US"
                  />
                  <div className="w-full border p-2 bg-gray-100 text-gray-700">
                    United States
                  </div>
                </div>

                <div className="space-y-4 border-t pt-4 mt-4">
                  <h3 className="font-medium">Delivery Preferences</h3>

                  <div>
                    <textarea
                      {...register("preferences.specialInstructions")}
                      className="w-full border p-2 h-24"
                      placeholder="Special delivery instructions (optional)"
                    />
                    {errors.preferences?.specialInstructions && (
                      <p className="text-red-500 text-sm">
                        {errors.preferences.specialInstructions.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {Object.keys(errors).length > 0 && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
                  <p>Form has validation errors:</p>
                  <pre className="text-sm mt-2">
                    {JSON.stringify(errors, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => setStep("contents")}
                  disabled={isSubmitting}
                  variant="secondary"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isConfirming}
                  variant="primary"
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>Preparing...</span>
                    </>
                  ) : isConfirming ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>Confirming...</span>
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </div>

              {isError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
                  {writeContractError?.message?.includes("User denied")
                    ? "Transaction was rejected"
                    : "Failed to submit transaction"}
                </div>
              )}

              {hash && (
                <TransactionStates
                  hash={hash}
                  onClose={() => {
                    reset();
                    setQuantities({});
                    setStep("contents");
                    onClose();
                  }}
                  chainId={chain?.id ?? 1}
                />
              )}
            </form>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
};

const ConnectedAccountTokenInfo = () => {
  const [isShippingOpen, setIsShippingOpen] = useState(false);
  const { status, address, chainId } = useAccount();

  if (status === "connected") {
    return (
      <div className="fixed bottom-4 left-4 max-w-sm w-full">
        <div className="space-y-4">
          <TokenBalanceInfo
            address={TEST_556_TOKEN_ADDRESS[chainId].address as `0x${string}`}
            symbol={TEST_556_TOKEN_ADDRESS[chainId].symbol}
            priceUsd={0.3}
            accountAddress={address}
          />
          <ShippingForm
            isOpen={isShippingOpen}
            onClose={() => setIsShippingOpen(false)}
            address={address}
            tokenAddress={
              TEST_556_TOKEN_ADDRESS[chainId].address as `0x${string}`
            }
          />
          <Button
            onClick={() => setIsShippingOpen(true)}
            variant="primary"
            fullWidth
            disabled={false} // todo: disable if no ammo
          >
            Ship Ammo
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default ConnectedAccountTokenInfo;
