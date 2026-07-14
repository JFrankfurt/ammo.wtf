import ammoTokenAbi from "@/abi/ammoToken";
import { getTokensForChain, requireChainConfig } from "@/addresses";
import { Button } from "@/components/Button";
import { FormInput } from "@/components/FormInput";
import { FormSelect } from "@/components/FormSelect";
import { TransactionStatus } from "@/components/TransactionStatus";
import { useAdminTransaction } from "@/hooks/useAdminTransaction";
import { truncateAddress } from "@/utils/address";
import { DialogTitle } from "@headlessui/react";
import { useCallback, useState } from "react";
import { isAddress, parseEther } from "viem";
import { useAccount, useWriteContract } from "wagmi";

export function MintAdditionalInventory({ onBack }: { onBack: () => void }) {
  const [tokenAddress, setTokenAddress] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [validationError, setValidationError] = useState("");
  const { chainId } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const transaction = useAdminTransaction();

  const mintTokens = useCallback(async () => {
    let parsedAmount: bigint;

    try {
      requireChainConfig(chainId, "Admin inventory minting");
      if (!isAddress(tokenAddress) || !isAddress(recipientAddress)) {
        throw new Error("Select a token and enter a valid recipient address.");
      }
      if (!amount || Number(amount) <= 0) {
        throw new Error("Enter an amount greater than zero.");
      }
      parsedAmount = parseEther(amount);
    } catch (error) {
      setValidationError(
        error instanceof Error ? error.message : "Unable to mint inventory."
      );
      return;
    }

    setValidationError("");
    await transaction
      .execute(() =>
        writeContractAsync({
          address: tokenAddress,
          abi: ammoTokenAbi,
          functionName: "mint",
          args: [recipientAddress, parsedAmount],
        })
      )
      .catch(() => undefined);
  }, [
    amount,
    chainId,
    recipientAddress,
    tokenAddress,
    transaction,
    writeContractAsync,
  ]);

  if (!chainId) {
    return <p className="text-sm text-muted">Connect to a network.</p>;
  }

  let tokens;
  try {
    requireChainConfig(chainId, "Admin inventory minting");
    tokens = getTokensForChain(chainId);
  } catch (error) {
    return (
      <TransactionStatus
        status="error"
        error={
          error instanceof Error ? error : new Error("Unsupported network")
        }
        chainId={chainId}
      />
    );
  }

  return (
    <div className="space-y-4">
      <DialogTitle className="text-xl md:text-2xl font-medium text-sumiBlack">
        Mint Additional Inventory
      </DialogTitle>
      <FormSelect
        value={tokenAddress}
        onChange={(event) => setTokenAddress(event.target.value)}
        label="Token Address"
        id="tokenAddress"
        disabled={transaction.isBusy}
        options={tokens.map((token) => ({
          value: token.address,
          label: `${token.name} (${truncateAddress(token.address)})`,
        }))}
      />
      <FormInput
        value={recipientAddress}
        onChange={(event) => setRecipientAddress(event.target.value)}
        label="Recipient Address"
        placeholder="Enter recipient address"
        id="recipientAddress"
        disabled={transaction.isBusy}
      />
      <FormInput
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        label="Amount"
        type="number"
        placeholder="Enter amount"
        id="amount"
        min="0"
        step="0.000000000000000001"
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
            ? "Additional inventory minted."
            : "Mint transaction pending…"
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
            Mint More
          </Button>
        )}
        <Button
          variant="primary"
          disabled={
            !tokenAddress ||
            !recipientAddress ||
            !amount ||
            transaction.isBusy ||
            transaction.status === "success"
          }
          onClick={mintTokens}
        >
          {transaction.isBusy ? "Minting..." : "Mint Tokens"}
        </Button>
      </div>
    </div>
  );
}
