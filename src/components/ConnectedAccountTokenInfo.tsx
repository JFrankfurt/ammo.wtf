"use client";

import { Button, Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { useAccount, useReadContract } from "wagmi";
import { z } from "zod";
import erc20Abi from "../abi/erc20";
import {
  encryptData,
  encryptSymmetricKey,
  generateSymmetricKey,
} from "../data/shipping-encryption";
import { shippingSchema } from "../data/shipping-validation";

export interface Token {
  address: `0x${string}`;
  symbol: string;
  priceUsd: number;
}

export const tokens: Token[] = [
  {
    address: "0x0000000000000000000000000000000000000000",
    symbol: "5.56",
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

  return (
    <div className="space-y-4 flex flex-row justify-between">
      <div className="text-lg">
        {symbol}: {balance?.toString() || "none"}
      </div>
    </div>
  );
};

export const ShippingForm = ({
  isOpen,
  onClose,
  address,
}: {
  isOpen: boolean;
  onClose: () => void;
  address: `0x${string}`;
}) => {
  const [step, setStep] = useState<"contents" | "shipping">("contents");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        country: "",
      },
      preferences: {
        requireSignature: true,
        insurance: true,
        specialInstructions: "",
      },
      metadata: {
        version: "1.0" as const,
        timestamp: 0,
        origin: "marketplace-v2",
      },
    },
  });

  const { data: balance556 } = useReadContract({
    address: tokens[0].address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address],
  });

  const balances = [{ token: tokens[0], balance: balance556 || BigInt(0) }];

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

  const onSubmit = async (data: z.infer<typeof shippingSchema>) => {
    try {
      setIsSubmitting(true);

      // Prepare shipping data
      const shippingData = {
        ...data,
        orderId: uuidv4(),
        metadata: {
          version: "1.0",
          timestamp: Date.now(),
          origin: "marketplace-v2",
        },
        quantity: totalValue,
      };

      // Generate example ECC key pair for the shipper
      const shipperKeyPair = await crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveKey", "deriveBits"]
      );

      // Encrypt shipping data
      const aesKey = await generateSymmetricKey();
      const { encryptedData, iv } = await encryptData(
        JSON.stringify(shippingData),
        aesKey
      );
      const encryptedKeyData = await encryptSymmetricKey(
        aesKey,
        shipperKeyPair.publicKey
      );

      // TODO: Submit encrypted data to blockchain
      console.log("Encrypted package:", {
        encryptedData,
        iv,
        ...encryptedKeyData,
      });

      reset();
      setQuantities({});
      setStep("contents");
      onClose();
    } catch (error) {
      console.error("Error submitting shipping form:", error);
      // TODO: Add proper error handling/display
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="max-w-4xl space-y-4 border bg-white p-12">
          <DialogTitle className="font-bold">Ship Tokens</DialogTitle>

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
                    const maxUnits = Number(balance) / 250;
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
                  disabled={hasSelectedQuantities}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => setStep("contents")}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
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
          />
          <Button
            onClick={() => setIsShippingOpen(true)}
            className="w-full px-4 py-2 text-shiroWhite bg-black shadow font-medium"
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
