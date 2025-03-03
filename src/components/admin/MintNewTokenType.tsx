import { DialogTitle } from "@headlessui/react";
import { FormInput } from "@/src/components/FormInput";
import { Button } from "@headlessui/react";
import { useAccount, useWriteContract } from "wagmi";
import { useCallback, useState } from "react";
import ammoTokenFactory from "@/src/abi/ammoFactory";
import { FACTORY_ADDRESS } from "@/src/addresses";
import { parseEther } from "viem";
import { getExplorerUrl } from "@/src/utils/blockExplorer";

export function MintNewTokenType({ onBack }: { onBack: () => void }) {
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [initialSupply, setInitialSupply] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string>("");
  const { chainId } = useAccount();
  const { writeContract, isPending: isLoading } = useWriteContract();

  const createToken = useCallback(() => {
    if (!chainId) {
      setError("Please connect to a supported chain");
      return;
    }
    if (!tokenName || !tokenSymbol) {
      setError("Please fill in all fields");
      return;
    }

    setError("");
    console.log("FACTORY_ADDRESS", FACTORY_ADDRESS[chainId]);
    console.log("chainId", chainId);
    console.log("tokenName", tokenName);
    console.log("tokenSymbol", tokenSymbol);
    console.log("initialSupply", initialSupply);
    console.log("parseEther(initialSupply)", parseEther(initialSupply));
    writeContract(
      {
        address: FACTORY_ADDRESS[chainId],
        abi: ammoTokenFactory,
        functionName: "createToken",
        args: [tokenName, tokenSymbol, parseEther(initialSupply)],
      },
      {
        onSuccess: (hash) => {
          setTxHash(hash);
          setSuccess(true);
        },
        onError: (error) => {
          setError(error.message || "Failed to create token");
        },
      }
    );
  }, [chainId, tokenName, tokenSymbol, writeContract, initialSupply]);

  if (success) {
    return (
      <div className="space-y-form-gap">
        <DialogTitle className="text-2xl font-medium text-sumiBlack mb-6">
          Success!
        </DialogTitle>
        <p className="text-sumiBlack">
          New token type {tokenName} ({tokenSymbol}) has been created.
        </p>
        <a
          href={`${getExplorerUrl(chainId)}/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-hinokiWood hover:text-kansoClay underline"
        >
          View transaction on block explorer
        </a>
        <div className="flex justify-end pt-4">
          <Button
            className="px-6 py-3 bg-hinokiWood text-shiroWhite rounded-form 
                       hover:bg-kansoClay transition-form duration-form"
            onClick={onBack}
          >
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-form-gap">
      <DialogTitle className="text-2xl font-medium text-sumiBlack mb-6">
        Mint New Token Type
      </DialogTitle>
      {error && (
        <div className="text-red-500 bg-red-50 p-3 rounded-form">{error}</div>
      )}
      <FormInput
        label="Token Name"
        placeholder="Enter token name"
        id="tokenName"
        value={tokenName}
        onChange={(e) => setTokenName(e.target.value)}
      />
      <FormInput
        label="Token Symbol"
        placeholder="Enter token symbol"
        id="tokenSymbol"
        value={tokenSymbol}
        onChange={(e) => setTokenSymbol(e.target.value)}
      />
      <FormInput
        label="Initial Supply"
        placeholder="Enter initial supply"
        id="initialSupply"
        value={initialSupply}
        onChange={(e) => setInitialSupply(e.target.value)}
      />
      <div className="flex justify-between pt-4">
        <Button
          className="px-6 py-3 bg-ashiStone text-shiroWhite rounded-form 
                     hover:bg-kuroganeSteel transition-form duration-form"
          onClick={onBack}
          disabled={isLoading}
        >
          Back
        </Button>
        <Button
          disabled={!tokenName || !tokenSymbol || isLoading}
          onClick={createToken}
          className="px-6 py-3 bg-hinokiWood text-shiroWhite rounded-form 
                     hover:bg-kansoClay transition-form duration-form
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Creating..." : "Create Token"}
        </Button>
      </div>
    </div>
  );
}
