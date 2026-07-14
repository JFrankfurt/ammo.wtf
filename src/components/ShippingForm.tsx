import {
  CloseButton,
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Fragment, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useAccount } from "wagmi";
import { getTokensForChain } from "@/addresses";
import {
  shippingSchema,
  type ShippingData,
} from "@/data/shipping-validation";
import { useShippingRedemption } from "@/hooks/useShippingRedemption";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { buildCanonicalLineItems } from "@/utils/shippingRedemption";
import {
  ShippingFormAddress,
  type FormDataWithRequiredFields,
} from "./ShippingFormAddress";
import { ShippingFormContents } from "./ShippingFormContents";
import { TransactionStatus } from "./TransactionStatus";

type FormStep = "contents" | "shipping";

const REDEMPTION_MESSAGES = {
  encrypting: "Encrypting shipping details…",
  "reading-permits": "Reading token permit data…",
  submitting: "Submitting one batch redemption…",
  confirming: "Waiting for transaction confirmation…",
  success: "Shipping redemption confirmed.",
} as const;

const DEFAULT_VALUES: FormDataWithRequiredFields = {
  recipient: {
    name: "",
    email: "",
    phone: undefined,
  },
  address: {
    street1: "",
    street2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  },
  preferences: {
    requireSignature: true,
    insurance: false,
    specialInstructions: "",
  },
  metadata: {
    version: "1.0",
    origin: "marketplace-v1",
  },
};

export function ShippingForm({
  isOpen,
  onClose,
  address,
}: {
  isOpen: boolean;
  onClose: () => void;
  address: `0x${string}`;
}) {
  const { chainId } = useAccount();
  const [step, setStep] = useState<FormStep>("contents");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const redemption = useShippingRedemption();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormDataWithRequiredFields, unknown, ShippingData>({
    resolver: zodResolver(shippingSchema),
    mode: "onChange",
    defaultValues: DEFAULT_VALUES,
  });

  const allTokens = useMemo(
    () => (chainId ? getTokensForChain(chainId) : []),
    [chainId]
  );
  const { balances: tokenBalances, isLoading: balancesLoading } =
    useTokenBalances(allTokens, address);
  const tokensWithBalance = useMemo(
    () => allTokens.filter((token) => tokenBalances[token.address] > 0),
    [allTokens, tokenBalances]
  );
  const hasSelectedQuantities = Object.values(quantities).some(
    (quantity) => quantity > 0
  );
  const totalRounds = useMemo(
    () =>
      Object.entries(quantities).reduce((total, [tokenAddress, units]) => {
        const token = allTokens.find(
          (candidate) =>
            candidate.address.toLowerCase() === tokenAddress.toLowerCase()
        );
        return total + units * (token?.product.roundsPerUnit ?? 0);
      }, 0),
    [allTokens, quantities]
  );
  const totalValueUsd = useMemo(
    () =>
      Object.entries(quantities).reduce((total, [tokenAddress, units]) => {
        const token = allTokens.find(
          (candidate) =>
            candidate.address.toLowerCase() === tokenAddress.toLowerCase()
        );
        return token
          ? total +
              units *
                token.product.roundsPerUnit *
                token.product.estimatedValueUsdPerRound
          : total;
      }, 0),
    [allTokens, quantities]
  );
  const isBusy = [
    "encrypting",
    "reading-permits",
    "signing-permits",
    "submitting",
    "confirming",
  ].includes(redemption.status);
  const redemptionMessage =
    redemption.status === "signing-permits"
      ? `Signing exact permits: ${redemption.signedPermits} of ${redemption.totalPermits} complete…`
      : REDEMPTION_MESSAGES[
          redemption.status as keyof typeof REDEMPTION_MESSAGES
        ];
  const redemptionPresentationStatus =
    redemption.status === "error"
      ? "error"
      : redemption.status === "success"
        ? "success"
        : redemption.status === "idle"
          ? "idle"
          : "pending";

  function resetDialog() {
    reset(DEFAULT_VALUES);
    redemption.reset();
    setStep("contents");
    setQuantities({});
    setSelectionError(null);
  }

  function closeDialog() {
    if (isBusy) return;
    resetDialog();
    onClose();
  }

  function handleQuantityChange(tokenAddress: string, value: number) {
    const token = allTokens.find(
      (candidate) =>
        candidate.address.toLowerCase() === tokenAddress.toLowerCase()
    );
    const maximumUnits = token
      ? Math.floor(
          (tokenBalances[token.address] || 0) / token.product.roundsPerUnit
        )
      : 0;
    const units = Number.isFinite(value)
      ? Math.min(Math.max(Math.trunc(value), 0), maximumUnits)
      : 0;
    setQuantities((current) => ({ ...current, [tokenAddress]: units }));
    setSelectionError(null);
  }

  function continueToShipping() {
    try {
      buildCanonicalLineItems(allTokens, quantities);
      setSelectionError(null);
      setStep("shipping");
    } catch (error) {
      setSelectionError(
        error instanceof Error
          ? error.message
          : "Selected quantities are invalid."
      );
    }
  }

  async function submitShipping(data: ShippingData) {
    try {
      const lineItems = buildCanonicalLineItems(allTokens, quantities);
      setSelectionError(null);
      await redemption.redeem(data, lineItems);
    } catch {
      // The redemption hook stores a sanitized, user-facing error.
    }
  }

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeDialog}>
        <TransitionChild as={Fragment}>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition duration-300 data-[closed]:opacity-0"
            aria-hidden="true"
          />
        </TransitionChild>

        <div className="fixed inset-0 flex flex-col items-center justify-start overflow-y-auto p-3 md:p-4 lg:p-6">
          <TransitionChild as={Fragment}>
            <DialogPanel className="my-4 w-full max-w-md transform overflow-auto rounded-none border border-border bg-background p-4 transition-all duration-300 ease-out data-[closed]:scale-95 data-[closed]:opacity-0 md:my-8 md:max-w-lg md:p-6 lg:max-w-xl">
              <div className="mb-4 flex items-center justify-between">
                <DialogTitle
                  as="h3"
                  className="font-mono text-lg font-bold text-accentGreen"
                >
                  {step === "contents"
                    ? "Select Ammunition to Ship"
                    : "Shipping Information"}
                </DialogTitle>
                {!isBusy && (
                  <CloseButton
                    type="button"
                    className="text-muted hover:text-foreground focus:outline-none"
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
                )}
              </div>

              <div className="mt-3 space-y-4 md:mt-4">
                {selectionError && (
                  <div
                    role="alert"
                    className="border border-destructive bg-destructive/10 p-3 text-xs font-mono text-destructive"
                  >
                    {selectionError}
                  </div>
                )}

                {step === "contents" ? (
                  <ShippingFormContents
                    selectedTokens={tokensWithBalance}
                    quantities={quantities}
                    handleQuantityChange={handleQuantityChange}
                    totalRounds={totalRounds}
                    totalValueUsd={totalValueUsd}
                    onContinue={continueToShipping}
                    balancesLoading={balancesLoading}
                    tokenBalances={tokenBalances}
                    hasSelectedQuantities={hasSelectedQuantities}
                    disabledReason={redemption.disabledReason}
                  />
                ) : (
                  <form
                    onSubmit={handleSubmit(submitShipping)}
                    className="space-y-4"
                  >
                    <ShippingFormAddress
                      register={register}
                      errors={errors}
                      isSubmitting={isBusy || redemption.status === "success"}
                      onBack={() => {
                        redemption.reset();
                        setStep("contents");
                      }}
                    />
                    <TransactionStatus
                      status={redemptionPresentationStatus}
                      message={redemptionMessage}
                      error={redemption.error}
                      errorMessage={
                        redemption.status === "error"
                          ? redemption.error?.message
                          : undefined
                      }
                      hash={redemption.txHash}
                      chainId={chainId}
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
}
