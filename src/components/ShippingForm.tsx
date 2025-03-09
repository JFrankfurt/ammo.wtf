"use client";

import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Fragment, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { parseUnits } from "viem";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { z } from "zod";
import { default as ammoTokenABI } from "../abi/ammoTokenERC20";
import { getTokensForChain } from "../addresses";
import { getShipperPublicKey } from "../data/shipper-keys";
import {
  encryptData,
  encryptSymmetricKey,
  generateSymmetricKey,
} from "../data/shipping-encryption";
import { shippingSchema } from "../data/shipping-validation";
import { useTokenBalances } from "../hooks/useTokenBalances";
import {
  FormDataWithRequiredFields,
  ShippingFormAddress,
} from "./ShippingFormAddress";
import { ShippingFormContents } from "./ShippingFormContents";
import { SimpleTransactionStatus } from "./SimpleTransactionStatus";

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
  } = useForm<FormDataWithRequiredFields>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      recipient: {
        name: "",
        email: "",
        phone: undefined,
      },
      address: {
        street1: "",
        street2: undefined,
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

  // Get all tokens for the current chain
  const allTokens = useMemo(() => {
    return chainId ? getTokensForChain(chainId) : [];
  }, [chainId]);

  // Get token balances
  const { balances: tokenBalances, isLoading: balancesLoading } =
    useTokenBalances(allTokens, address);

  // Filter tokens to only show those with balances
  const tokensWithBalance = useMemo(() => {
    return allTokens.filter((token) => tokenBalances[token.address] > 0);
  }, [allTokens, tokenBalances]);

  // If a specific token address was provided, filter to just that token
  const selectedTokens = useMemo(() => {
    return tokenAddress &&
      tokenAddress !== "0x0000000000000000000000000000000000000000"
      ? allTokens.filter(
          (token) => token.address.toLowerCase() === tokenAddress.toLowerCase()
        )
      : tokensWithBalance;
  }, [tokenAddress, allTokens, tokensWithBalance]);

  const handleQuantityChange = (address: string, value: number) => {
    setQuantities((prev) => ({
      ...prev,
      [address]: value,
    }));
  };

  const totalTokens = useMemo(() => {
    return Object.entries(quantities).reduce(
      (sum, [_address, qty]) => sum + qty * 250,
      0
    );
  }, [quantities]);

  const totalValueUsd = useMemo(() => {
    return Object.entries(quantities).reduce((sum, [address, qty]) => {
      const token = allTokens.find((t) => t.address === address);
      return sum + (token?.priceUsd ?? 0.3) * qty * 250;
    }, 0);
  }, [quantities, allTokens]);

  const hasSelectedQuantities = useMemo(() => {
    return Object.values(quantities).some((qty) => qty > 0);
  }, [quantities]);

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
          ? "Transaction was rejected. Please try again."
          : "An error occurred while processing your request. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
      query: {
        enabled: !!hash,
      },
    });

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={() => {
          if (!isSubmitting && !isConfirming) {
            onClose();
            reset();
            setStep("contents");
            setQuantities({});
            setError(null);
          }
        }}
      >
        <TransitionChild as={Fragment}>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition duration-300 data-[closed]:opacity-0"
            aria-hidden="true"
          />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-3 md:p-4">
          <TransitionChild as={Fragment}>
            <DialogPanel className="w-full max-w-sm md:max-w-md transform overflow-hidden rounded-xl md:rounded-2xl bg-white p-4 md:p-6 shadow-xl transition-all duration-300 ease-out data-[closed]:opacity-0 data-[closed]:scale-95">
              <DialogTitle
                as="h3"
                className="text-base md:text-lg font-medium leading-6 text-gray-900"
              >
                {step === "contents"
                  ? "Select Ammunition to Ship"
                  : "Shipping Information"}
              </DialogTitle>

              <div className="mt-3 md:mt-4">
                {step === "contents" ? (
                  <ShippingFormContents
                    selectedTokens={selectedTokens}
                    quantities={quantities}
                    handleQuantityChange={handleQuantityChange}
                    totalTokens={totalTokens}
                    totalValueUsd={totalValueUsd}
                    onContinue={() => setStep("shipping")}
                    balancesLoading={balancesLoading}
                    tokenBalances={tokenBalances}
                    hasSelectedQuantities={hasSelectedQuantities}
                  />
                ) : (
                  <form onSubmit={handleSubmit(onSubmit, onError)}>
                    <ShippingFormAddress
                      register={register}
                      errors={errors}
                      isSubmitting={isSubmitting || isConfirming}
                      onBack={() => setStep("contents")}
                    />

                    {/* Transaction Status */}
                    <SimpleTransactionStatus
                      isPending={isPending}
                      isConfirming={isConfirming}
                      isConfirmed={isConfirmed}
                      isError={isError}
                      error={error || (writeContractError?.message as string)}
                      hash={hash}
                      chainId={chain?.id}
                    />
                  </form>
                )}
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};
