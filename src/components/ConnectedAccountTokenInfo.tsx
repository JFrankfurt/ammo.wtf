"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { parseEther } from "viem";
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
import { TEST_556_TOKEN_ADDRESS } from "../addresses";
import { getShipperPublicKey } from "../data/shipper-keys";
import {
  encryptData,
  encryptSymmetricKey,
  generateSymmetricKey,
} from "../data/shipping-encryption";
import { shippingSchema } from "../data/shipping-validation";
import { Button } from "./Button";
import { TransactionStates } from "./TransactionStates";

export interface Token {
  address: `0x${string}`;
  symbol: string;
  priceUsd: number;
}

export const tokens: Token[] = [
  {
    address: TEST_556_TOKEN_ADDRESS.address as `0x${string}`,
    symbol: "TEST 5.56",
    priceUsd: 0.75,
  },
];

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

  const formattedBalance = balance ? Number(balance) / Math.pow(10, 18) : null;

  return (
    <div className="space-y-4 flex flex-row justify-between">
      <div className="text-lg">
        {symbol}: {formattedBalance?.toLocaleString() || "none"}
      </div>
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
    address: tokens[0].address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address],
  });

  const formattedBalance556 = balance556
    ? Number(balance556) / Math.pow(10, 18)
    : 0;

  const balances = [{ token: tokens[0], balance: formattedBalance556 }];

  const handleQuantityChange = (address: string, value: number) => {
    setQuantities((prev) => ({
      ...prev,
      [address]: value,
    }));
  };

  const totalValue = Object.entries(quantities).reduce(
    (sum, [address, qty]) => {
      const token = tokens.find((t) => t.address === address);
      return sum + (token?.priceUsd || 0) * qty * 250;
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
        quantity: totalValue,
      };

      // Generate example ECC key pair for the shipper
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
      await writeContract({
        abi: ammoTokenABI,
        address: tokenAddress,
        functionName: "redeem",
        args: [
          address as `0x${string}`,
          parseEther(totalValue.toString()),
          `0x${Buffer.from(encryptedPackageBytes).toString(
            "hex"
          )}` as `0x${string}`,
        ],
      });

      // Don't reset form here - wait for confirmation
    } catch (error) {
      console.error("Error submitting shipping form:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while submitting your shipping information."
      );
      setIsSubmitting(false);
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
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="max-w-4xl space-y-4 border bg-white p-12">
          <DialogTitle className="font-bold">Ship Ammo</DialogTitle>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
              {error}
            </div>
          )}

          {step === "contents" ? (
            <div className="space-y-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Ammo Type</th>
                    <th className="text-right p-2">Available</th>
                    <th className="text-right p-2">Quantity</th>
                    <th className="text-right p-2">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {balances.map(({ token, balance }) => {
                    const maxUnits = balance / 250;
                    const quantity = quantities[token.address] || 0;
                    const value = quantity * 250 * token.priceUsd;

                    return (
                      <tr key={token.address} className="border-b">
                        <td className="p-2">{token.symbol}</td>
                        <td className="text-right p-2">{balance.toString()}</td>
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
                        <td className="text-right p-2">${value.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  <tr className="font-bold">
                    <td colSpan={3} className="text-right p-2">
                      Total Value:
                    </td>
                    <td className="text-right p-2">${totalValue.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

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
                  {writeContractError?.message ||
                    "Failed to submit transaction"}
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
  const { status, address } = useAccount();

  if (status === "connected") {
    return (
      <div className="fixed bottom-4 left-4">
        <div className="space-y-4">
          {tokens.map((token: Token) => (
            <TokenBalanceInfo
              key={token.address}
              {...token}
              accountAddress={address}
            />
          ))}
          <ShippingForm
            isOpen={isShippingOpen}
            onClose={() => setIsShippingOpen(false)}
            address={address}
            tokenAddress={TEST_556_TOKEN_ADDRESS.address as `0x${string}`}
          />
          <Button
            onClick={() => setIsShippingOpen(true)}
            variant="primary"
            fullWidth
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
