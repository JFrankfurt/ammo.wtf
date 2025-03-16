import ammoFactoryABI from "@/src/abi/ammoFactory";
import { FACTORY_ADDRESS } from "@/src/addresses";
import { Button } from "@/src/components/Button";
import { FormInput } from "@/src/components/FormInput";
import { getExplorerUrl } from "@/src/utils/blockExplorer";
import { DialogTitle } from "@headlessui/react";
import { fallbackChainId } from "@/src/utils/chains";
import { useCallback, useEffect, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

// Define the possible states for the component
type FeeRecipientState =
  | "idle" // Initial form state
  | "submitting" // Submitting transaction to wallet
  | "pending" // Transaction submitted, waiting for confirmation
  | "success" // Transaction confirmed successfully
  | "error"; // Transaction failed

export function SetFeeDetails({ onBack }: { onBack: () => void }) {
  const [recipientAddress, setRecipientAddress] = useState("");
  const [feePercentage, setFeePercentage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [state, setState] = useState<FeeRecipientState>("idle");

  const { chainId } = useAccount();

  const { data: feeDetails, refetch: refetchFeeDetails } = useReadContract({
    address: FACTORY_ADDRESS[chainId ?? fallbackChainId],
    abi: ammoFactoryABI,
    functionName: "getFeeDetails",
  });

  // Set initial values from contract when data is loaded
  useEffect(() => {
    if (feeDetails && feeDetails.length >= 2) {
      // Only set initial values if the form is empty
      if (!recipientAddress && feeDetails[0]) {
        setRecipientAddress(feeDetails[0]);
      }

      if (!feePercentage && feeDetails[1] !== undefined) {
        // Convert from bigint to string for the input
        setFeePercentage(feeDetails[1].toString());
      }
    }
  }, [feeDetails, recipientAddress, feePercentage]);

  // Use the waitForTransactionReceipt hook to monitor transaction status
  const {
    isLoading: isTransactionPending,
    isSuccess: isTransactionSuccess,
    isError: isTransactionError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Update the state based on transaction status
  useEffect(() => {
    if (txHash) {
      if (isTransactionPending) {
        setState("pending");
      } else if (isTransactionSuccess) {
        setState("success");
        // Refresh fee details after successful update
        refetchFeeDetails();
      } else if (isTransactionError) {
        setState("error");
        setErrorMessage("Transaction failed. Please try again.");
      }
    }
  }, [
    txHash,
    isTransactionPending,
    isTransactionSuccess,
    isTransactionError,
    refetchFeeDetails,
  ]);

  const { writeContract } = useWriteContract();

  const handleSubmit = useCallback(() => {
    if (!recipientAddress) {
      setErrorMessage("Please enter a recipient address");
      return;
    }

    if (feePercentage === "" || isNaN(Number(feePercentage))) {
      setErrorMessage("Please enter a valid fee percentage");
      return;
    }

    setErrorMessage("");
    setState("submitting");

    // Convert fee percentage to BigInt
    const feePercentageBigInt = BigInt(feePercentage);

    writeContract(
      {
        address: FACTORY_ADDRESS[chainId ?? fallbackChainId],
        abi: ammoFactoryABI,
        functionName: "setFeeDetails",
        args: [recipientAddress as `0x${string}`, feePercentageBigInt],
      },
      {
        onSuccess: (hash) => {
          setTxHash(hash);
          setState("pending");
        },
        onError: (error) => {
          setErrorMessage(error.message || "Failed to update fee details");
          setState("error");
        },
      }
    );
  }, [recipientAddress, feePercentage, writeContract, chainId]);

  // Reset the form and state
  const handleReset = () => {
    setState("idle");
    // Don't reset the form values, just clear error and hash
    setErrorMessage("");
    setTxHash(undefined);
  };

  switch (state) {
    case "success":
      return (
        <div className="space-y-4">
          <DialogTitle className="text-xl md:text-2xl font-medium text-sumiBlack">
            Success!
          </DialogTitle>
          <div className="bg-green-50 p-4 rounded-xl border border-green-200 mb-4">
            <div className="flex items-center mb-2">
              <svg
                className="w-5 h-5 text-green-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <span className="font-medium text-green-700">
                Transaction Confirmed
              </span>
            </div>
            <p className="text-sumiBlack">
              Fee details have been successfully updated. Recipient is now{" "}
              <span className="font-medium">{recipientAddress}</span> with a fee
              percentage of <span className="font-medium">{feePercentage}</span>
              .
            </p>
          </div>
          <div className="flex flex-col space-y-2">
            <a
              href={`${getExplorerUrl(chainId)}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-hinokiWood hover:text-kansoClay underline flex items-center"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path>
              </svg>
              View transaction on block explorer
            </a>
          </div>
          <div className="flex justify-between pt-4">
            <Button variant="secondary" onClick={handleReset}>
              Update Again
            </Button>
            <Button variant="primary" onClick={onBack}>
              Done
            </Button>
          </div>
        </div>
      );

    case "pending":
      return (
        <div className="space-y-4">
          <DialogTitle className="text-xl md:text-2xl font-medium text-sumiBlack">
            Transaction Pending
          </DialogTitle>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mb-4">
            <div className="flex items-center mb-2">
              <svg
                className="w-5 h-5 text-blue-500 mr-2 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="font-medium text-blue-700">
                Waiting for confirmation
              </span>
            </div>
            <p className="text-sumiBlack">
              Your transaction to update the fee details is being processed on
              the blockchain. This may take a few moments.
            </p>
          </div>
          <div className="flex flex-col space-y-2">
            <a
              href={`${getExplorerUrl(chainId)}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-hinokiWood hover:text-kansoClay underline flex items-center"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path>
              </svg>
              View transaction on block explorer
            </a>
          </div>
        </div>
      );

    case "submitting":
      return (
        <div className="space-y-4">
          <DialogTitle className="text-xl md:text-2xl font-medium text-sumiBlack">
            Confirm Transaction
          </DialogTitle>
          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 mb-4">
            <div className="flex items-center mb-2">
              <svg
                className="w-5 h-5 text-yellow-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <span className="font-medium text-yellow-700">
                Waiting for wallet confirmation
              </span>
            </div>
            <p className="text-sumiBlack">
              Please confirm the transaction in your wallet to update the fee
              details.
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-pulse flex space-x-2">
              <div className="h-2 w-2 bg-hinokiWood rounded-full"></div>
              <div className="h-2 w-2 bg-hinokiWood rounded-full"></div>
              <div className="h-2 w-2 bg-hinokiWood rounded-full"></div>
            </div>
          </div>
        </div>
      );

    case "error":
      return (
        <div className="space-y-4">
          <DialogTitle className="text-xl md:text-2xl font-medium text-sumiBlack">
            Error
          </DialogTitle>
          <div className="bg-red-50 p-4 rounded-xl border border-red-200 mb-4">
            <div className="flex items-center mb-2">
              <svg
                className="w-5 h-5 text-red-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <span className="font-medium text-red-700">
                Transaction Failed
              </span>
            </div>
            <p className="text-sumiBlack">
              {errorMessage ||
                "There was an error processing your transaction. Please try again."}
            </p>
          </div>
          {txHash && (
            <div className="flex flex-col space-y-2">
              <a
                href={`${getExplorerUrl(chainId)}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-hinokiWood hover:text-kansoClay underline flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path>
                </svg>
                View transaction on block explorer
              </a>
            </div>
          )}
          <div className="flex justify-between pt-4">
            <Button variant="secondary" onClick={onBack}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleReset}>
              Try Again
            </Button>
          </div>
        </div>
      );

    default: // idle state - show the form
      return (
        <div className="space-y-4">
          <DialogTitle className="text-xl md:text-2xl font-medium text-sumiBlack">
            Set Fee Details
          </DialogTitle>
          {errorMessage && (
            <div className="bg-red-50 p-3 rounded-xl border border-red-200">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-red-500 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                <span className="text-red-700">{errorMessage}</span>
              </div>
            </div>
          )}
          <FormInput
            label="Recipient Address"
            placeholder="Enter recipient address"
            id="recipient"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
          />
          <FormInput
            label="Fee Percentage"
            placeholder="Enter fee percentage"
            id="feePercentage"
            value={feePercentage}
            onChange={(e) => setFeePercentage(e.target.value)}
            type="number"
          />
          <div className="flex justify-between pt-4">
            <Button variant="secondary" onClick={onBack}>
              Back
            </Button>
            <Button
              variant="primary"
              disabled={!recipientAddress || !feePercentage}
              onClick={handleSubmit}
            >
              Update Fee Details
            </Button>
          </div>
        </div>
      );
  }
}
