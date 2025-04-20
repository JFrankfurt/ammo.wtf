import ammoTokenERC20 from "@/abi/ammoTokenERC20";
import { getTokensForChain } from "@/addresses";
import { Button } from "@/components/Button";
import { FormInput } from "@/components/FormInput";
import { FormSelect } from "@/components/FormSelect";
import { truncateAddress } from "@/utils/address";
import { DialogTitle } from "@headlessui/react";
import { useCallback, useState } from "react";
import { parseEther } from "viem";
import { useAccount, useWriteContract } from "wagmi";

export function MintAdditionalInventory({ onBack }: { onBack: () => void }) {
  const [tokenAddress, setTokenAddress] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const { writeContract, isPending: isLoading } = useWriteContract();
  const { chainId } = useAccount();

  const mintTokens = useCallback(() => {
    if (!tokenAddress || !recipientAddress || !amount) {
      return;
    }

    writeContract({
      address: tokenAddress as `0x${string}`,
      abi: ammoTokenERC20,
      functionName: "mint",
      args: [
        recipientAddress as `0x${string}`,
        parseEther(amount), // Convert amount to wei (18 decimals)
      ],
    });
  }, [writeContract, tokenAddress, recipientAddress, amount]);

  if (!chainId) {
    return <div>Connect to a network</div>;
  }

  return (
    <div className="space-y-4">
      <DialogTitle className="text-xl md:text-2xl font-medium text-sumiBlack">
        Mint Additional Inventory
      </DialogTitle>
      <FormSelect
        value={tokenAddress}
        onChange={(e) => setTokenAddress(e.target.value)}
        label="Token Address"
        id="tokenAddress"
        options={getTokensForChain(chainId).map((token) => ({
          value: token.address,
          label: `${token.name} (${truncateAddress(token.address)})`,
        }))}
      />
      <FormInput
        value={recipientAddress}
        onChange={(e) => setRecipientAddress(e.target.value)}
        label="Recipient Address"
        placeholder="Enter recipient address"
        id="recipientAddress"
      />
      <FormInput
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        label="Amount"
        type="number"
        placeholder="Enter amount"
        id="amount"
        min="0"
        step="0.000000000000000001" // Allow for 18 decimal places
      />
      <div className="flex justify-between pt-4">
        <Button variant="secondary" onClick={onBack} disabled={isLoading}>
          Back
        </Button>
        <Button
          variant="primary"
          disabled={!tokenAddress || !recipientAddress || !amount || isLoading}
          onClick={mintTokens}
        >
          {isLoading ? "Minting..." : "Mint Tokens"}
        </Button>
      </div>
    </div>
  );
}
