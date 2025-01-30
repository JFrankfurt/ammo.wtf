"use client";

import {
  Button,
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import {
  useAccount,
  useConnect,
  useConnectors,
  useDisconnect,
  useReadContract,
} from "wagmi";
import { z } from "zod";
import erc20Abi from "../abi/erc20";
import {
  encryptData,
  encryptSymmetricKey,
  generateSymmetricKey,
} from "../data/shipping-encryption";
import { shippingSchema } from "../data/shipping-validation";

interface Token {
  address: `0x${string}`;
  symbol: string;
}

const tokens: Token[] = [
  {
    address: "0x0000000000000000000000000000000000000000",
    symbol: "5.56",
  },
];

const TokenBalanceInfo = ({
  address,
  symbol,
  accountAddress,
}: Token & { accountAddress: `0x${string}` }) => {
  const [isShippingOpen, setIsShippingOpen] = useState(false);
  const { data: balance } = useReadContract({
    address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [accountAddress],
  });

  const canShip = balance && balance >= BigInt(250);

  return (
    <div className="space-y-4">
      <div className="text-lg">
        {symbol}: {balance?.toString() || "none"}
      </div>
      {!canShip && (
        <Button onClick={() => setIsShippingOpen(true)}>Ship Tokens</Button>
      )}
      <ShippingForm
        isOpen={isShippingOpen}
        onClose={() => setIsShippingOpen(false)}
        address={accountAddress}
        balance={balance}
      />
    </div>
  );
};

const ShippingForm = ({
  isOpen,
  onClose,
  address,
  balance,
}: {
  isOpen: boolean;
  onClose: () => void;
  address: `0x${string}`;
  balance: bigint | undefined;
}) => {
  const [step, setStep] = useState<"quantity" | "shipping">("quantity");
  const [quantity, setQuantity] = useState<number>(0);
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

  const maxShippableUnits = balance ? Number(balance) / 250 : 0;

  const handleQuantitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity > 0 && quantity <= maxShippableUnits) {
      setStep("shipping");
    }
  };

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
        quantity: quantity * 250, // Include quantity in shipping data
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
      setQuantity(0);
      setStep("quantity");
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
        <DialogPanel className="max-w-lg space-y-4 border bg-white p-12">
          <DialogTitle className="font-bold">Ship Tokens</DialogTitle>

          {step === "quantity" ? (
            <form onSubmit={handleQuantitySubmit} className="space-y-4">
              <Description className="text-center text-xl">
                Select number of 250-cartridge bags to ship. (Maximum:{" "}
                {Math.floor(maxShippableUnits)})
              </Description>
              <input
                type="number"
                min="1"
                max={Math.floor(maxShippableUnits)}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full border p-2"
                placeholder="Number of 250-token bags"
              />
              <Button
                type="submit"
                className="w-full"
                disabled={!quantity || quantity > maxShippableUnits}
              >
                Next
              </Button>
            </form>
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
                  <select
                    {...register("address.country")}
                    className="w-full border p-2"
                  >
                    <option value="">Select Country</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    {/* Add more countries as needed */}
                  </select>
                  {errors.address?.country && (
                    <p className="text-red-500 text-sm">
                      {errors.address.country.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => setStep("quantity")}
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
  const { status, address } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const connectors = useConnectors();
  const connector = connectors[0];

  if (status === "disconnected") {
    return (
      <div className="fixed top-4 left-4 z-50">
        <Button
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          onClick={() => connect({ connector })}
        >
          Connect Wallet
        </Button>
      </div>
    );
  }

  if (status === "connecting" || status === "reconnecting") {
    return (
      <div className="fixed top-4 left-4 z-50 bg-gray-100 p-4 rounded shadow">
        Connecting...
      </div>
    );
  }

  if (status === "connected") {
    return (
      <div className="fixed top-4 left-4 z-50 bg-white p-6 rounded shadow-lg border">
        <div className="space-y-4">
          {tokens.map((token: Token) => (
            <TokenBalanceInfo
              key={token.address}
              {...token}
              accountAddress={address}
            />
          ))}
          <Button
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded w-full"
            onClick={() => disconnect({ connector })}
          >
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default ConnectedAccountTokenInfo;
