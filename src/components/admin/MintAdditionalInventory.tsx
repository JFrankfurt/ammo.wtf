import { DialogTitle } from "@headlessui/react";
import { FormInput } from "@/src/components/FormInput";
import { Button } from "@headlessui/react";
import { useWriteContract } from "wagmi";
import { useCallback, useState } from "react";

export function MintAdditionalInventory({ onBack }: { onBack: () => void }) {
  const [tokenAddress, setTokenAddress] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const { writeContract } = useWriteContract();

  const mintTokens = useCallback(() => {
    if (!tokenAddress || !recipientAddress || !amount) {
      return;
    }
    writeContract({
      address: tokenAddress as `0x${string}`,
      abi: [],
      functionName: "mint",
      args: [recipientAddress as `0x${string}`, amount],
    });
  }, [writeContract, tokenAddress, recipientAddress, amount]);

  return (
    <div className="space-y-form-gap">
      <DialogTitle className="text-2xl font-medium text-sumiBlack mb-6">
        Mint Additional Inventory
      </DialogTitle>
      <FormInput
        value={tokenAddress}
        onChange={(e) => setTokenAddress(e.target.value)}
        label="Token Address"
        placeholder="Enter token address"
        id="tokenAddress"
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
      />
      <div className="flex justify-between pt-4">
        <Button
          className="px-6 py-3 bg-ashiStone text-shiroWhite rounded-form 
                     hover:bg-kuroganeSteel transition-form duration-form"
          onClick={onBack}
        >
          Back
        </Button>
        <Button
          disabled={!tokenAddress || !recipientAddress || !amount}
          onClick={mintTokens}
          className="px-6 py-3 bg-hinokiWood text-shiroWhite rounded-form 
                     hover:bg-kansoClay transition-form duration-form"
        >
          Mint Tokens
        </Button>
      </div>
    </div>
  );
}
