import { DialogTitle } from "@headlessui/react";
import { FormInput } from "@/src/components/FormInput";
import { Button } from "@/src/components/Button";
import { useAccount, useWriteContract } from "wagmi";
import { useCallback, useState } from "react";
import { TOKEN_ADDRESSES } from "@/src/addresses";
import { FormSelect } from "@/src/components/FormSelect";
import { truncateAddress } from "@/src/utils/address";
import ammoTokenERC20 from "@/src/abi/ammoTokenERC20";
import { parseEther } from "viem";

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
        options={TOKEN_ADDRESSES[chainId].map((token) => ({
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
