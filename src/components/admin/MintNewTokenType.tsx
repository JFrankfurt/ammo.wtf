import ammoFactory from "@/abi/ammoFactory";
import { requireChainConfig } from "@/addresses";
import { Button } from "@/components/Button";
import { FormInput } from "@/components/FormInput";
import { TransactionStatus } from "@/components/TransactionStatus";
import { useAdminTransaction } from "@/hooks/useAdminTransaction";
import { DialogTitle } from "@headlessui/react";
import { useCallback, useState } from "react";
import { parseEther } from "viem";
import { useAccount, useWriteContract } from "wagmi";

export function MintNewTokenType({ onBack }: { onBack: () => void }) {
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [initialSupply, setInitialSupply] = useState("");
  const [validationError, setValidationError] = useState("");
  const { chainId } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const transaction = useAdminTransaction();

  const createToken = useCallback(async () => {
    let factoryAddress: `0x${string}`;
    let parsedSupply: bigint;

    try {
      factoryAddress = requireChainConfig(
        chainId,
        "Admin token creation"
      ).contracts.ammoFactory;
      if (!tokenName.trim() || !tokenSymbol.trim()) {
        throw new Error("Enter a token name and symbol.");
      }
      if (!initialSupply || Number(initialSupply) <= 0) {
        throw new Error("Enter an initial supply greater than zero.");
      }
      parsedSupply = parseEther(initialSupply);
    } catch (error) {
      setValidationError(
        error instanceof Error ? error.message : "Unable to create token."
      );
      return;
    }

    setValidationError("");
    await transaction
      .execute(() =>
        writeContractAsync({
          address: factoryAddress,
          abi: ammoFactory,
          functionName: "createToken",
          args: [tokenName.trim(), tokenSymbol.trim(), parsedSupply],
        })
      )
      .catch(() => undefined);
  }, [
    chainId,
    initialSupply,
    tokenName,
    tokenSymbol,
    transaction,
    writeContractAsync,
  ]);

  const handleReset = () => {
    transaction.reset();
    setTokenName("");
    setTokenSymbol("");
    setInitialSupply("");
    setValidationError("");
  };

  return (
    <div className="space-y-4">
      <DialogTitle className="text-xl md:text-2xl font-medium text-sumiBlack">
        Create New Token Type
      </DialogTitle>
      <FormInput
        label="Token Name"
        placeholder="Enter token name"
        id="tokenName"
        value={tokenName}
        onChange={(event) => setTokenName(event.target.value)}
        disabled={transaction.isBusy}
      />
      <FormInput
        label="Token Symbol"
        placeholder="Enter token symbol"
        id="tokenSymbol"
        value={tokenSymbol}
        onChange={(event) => setTokenSymbol(event.target.value)}
        disabled={transaction.isBusy}
      />
      <FormInput
        label="Initial Supply"
        placeholder="Enter initial supply"
        id="initialSupply"
        type="number"
        min="0"
        value={initialSupply}
        onChange={(event) => setInitialSupply(event.target.value)}
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
            ? `${tokenName} (${tokenSymbol}) created successfully.`
            : "Token creation transaction pending…"
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
          <Button variant="secondary" onClick={handleReset}>
            Create Another
          </Button>
        )}
        <Button
          variant="primary"
          disabled={
            !tokenName ||
            !tokenSymbol ||
            !initialSupply ||
            transaction.isBusy ||
            transaction.status === "success"
          }
          onClick={createToken}
        >
          {transaction.isBusy ? "Creating..." : "Create Token"}
        </Button>
      </div>
    </div>
  );
}
