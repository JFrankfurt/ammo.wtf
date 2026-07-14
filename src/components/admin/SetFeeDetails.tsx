import ammoFactoryAbi from "@/abi/ammoFactory";
import { getChainConfig, requireChainConfig } from "@/addresses";
import { Button } from "@/components/Button";
import { FormInput } from "@/components/FormInput";
import { TransactionStatus } from "@/components/TransactionStatus";
import { useAdminTransaction } from "@/hooks/useAdminTransaction";
import { DialogTitle } from "@headlessui/react";
import { useCallback, useEffect, useState } from "react";
import { isAddress } from "viem";
import { useAccount, useReadContract, useWriteContract } from "wagmi";

export function SetFeeDetails({ onBack }: { onBack: () => void }) {
  const [recipientAddress, setRecipientAddress] = useState("");
  const [feePercentage, setFeePercentage] = useState("");
  const [validationError, setValidationError] = useState("");
  const { chainId } = useAccount();
  const chainConfig = getChainConfig(chainId);
  const { writeContractAsync } = useWriteContract();
  const transaction = useAdminTransaction();

  const { data: feeDetails, refetch: refetchFeeDetails } = useReadContract({
    address: chainConfig?.contracts.ammoFactory,
    abi: ammoFactoryAbi,
    functionName: "getFeeDetails",
    query: { enabled: Boolean(chainConfig) },
  });

  useEffect(() => {
    if (!feeDetails) return;
    if (!recipientAddress) setRecipientAddress(feeDetails[0]);
    if (!feePercentage) setFeePercentage(feeDetails[1].toString());
  }, [feeDetails, feePercentage, recipientAddress]);

  useEffect(() => {
    if (transaction.status === "success") {
      void refetchFeeDetails();
    }
  }, [refetchFeeDetails, transaction.status]);

  const handleSubmit = useCallback(async () => {
    let factoryAddress: `0x${string}`;
    let parsedFee: bigint;

    try {
      factoryAddress = requireChainConfig(
        chainId,
        "Admin fee updates"
      ).contracts.ammoFactory;
      if (!isAddress(recipientAddress)) {
        throw new Error("Enter a valid fee recipient address.");
      }
      parsedFee = BigInt(feePercentage);
      if (parsedFee < 0n) {
        throw new Error("Fee percentage cannot be negative.");
      }
    } catch (error) {
      setValidationError(
        error instanceof Error ? error.message : "Unable to update fee details."
      );
      return;
    }

    setValidationError("");
    await transaction
      .execute(() =>
        writeContractAsync({
          address: factoryAddress,
          abi: ammoFactoryAbi,
          functionName: "setFeeDetails",
          args: [recipientAddress, parsedFee],
        })
      )
      .catch(() => undefined);
  }, [
    chainId,
    feePercentage,
    recipientAddress,
    transaction,
    writeContractAsync,
  ]);

  return (
    <div className="space-y-4">
      <DialogTitle className="text-xl md:text-2xl font-medium text-sumiBlack">
        Set Fee Details
      </DialogTitle>
      <FormInput
        label="Recipient Address"
        placeholder="Enter recipient address"
        id="recipient"
        value={recipientAddress}
        onChange={(event) => setRecipientAddress(event.target.value)}
        disabled={transaction.isBusy}
      />
      <FormInput
        label="Fee Percentage"
        placeholder="Enter fee percentage"
        id="feePercentage"
        value={feePercentage}
        onChange={(event) => setFeePercentage(event.target.value)}
        type="number"
        min="0"
        step="1"
        disabled={transaction.isBusy}
      />
      <TransactionStatus
        status={validationError ? "error" : transaction.status}
        error={validationError || transaction.error}
        errorMessage={validationError || undefined}
        hash={transaction.hash}
        chainId={chainId}
        message={
          transaction.status === "success"
            ? "Fee details updated successfully."
            : "Fee update transaction pending…"
        }
      />
      <div className="flex justify-between gap-2 pt-4">
        <Button
          variant="secondary"
          onClick={onBack}
          disabled={transaction.isBusy}
        >
          Back
        </Button>
        {transaction.status === "success" && (
          <Button variant="secondary" onClick={transaction.reset}>
            Update Again
          </Button>
        )}
        <Button
          variant="primary"
          disabled={
            !recipientAddress ||
            feePercentage === "" ||
            transaction.isBusy ||
            transaction.status === "success"
          }
          onClick={handleSubmit}
        >
          {transaction.isBusy ? "Updating..." : "Update Fee Details"}
        </Button>
      </div>
    </div>
  );
}
