import { useWaitForTransactionReceipt } from "wagmi";
import { Button } from "./Button";

interface TransactionStatesProps {
  hash: `0x${string}` | undefined;
  onClose: () => void;
  chainId: number;
}

export const TransactionStates = ({
  hash,
  onClose,
  chainId,
}: TransactionStatesProps) => {
  const { isLoading, isSuccess, isError } = useWaitForTransactionReceipt({
    hash,
  });

  const getExplorerUrl = () => {
    const baseUrl =
      chainId === 5 ? "https://goerli.etherscan.io" : "https://etherscan.io";
    return `${baseUrl}/tx/${hash}`;
  };

  if (!hash) {
    return (
      <div className="fixed inset-0 bg-black/20 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full space-y-4">
          <h3 className="font-medium text-lg">Confirm Transaction</h3>
          <p className="text-gray-600">
            Please confirm the transaction in your wallet...
          </p>
          <div className="flex justify-center">
            <span className="animate-spin">⏳</span>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/20 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full space-y-4">
          <h3 className="font-medium text-lg">Transaction Pending</h3>
          <p className="text-gray-600">
            Your transaction is being processed...
          </p>
          <div className="flex justify-center">
            <span className="animate-spin">⏳</span>
          </div>
          <div className="text-center">
            <a
              href={getExplorerUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 underline"
            >
              View on Etherscan
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/20 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full space-y-4">
          <h3 className="font-medium text-lg text-green-600">Success!</h3>
          <p className="text-gray-600">
            Your shipping information has been submitted successfully.
          </p>
          <div className="text-center">
            <a
              href={getExplorerUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 underline"
            >
              View on Etherscan
            </a>
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose} variant="primary">
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="fixed inset-0 bg-black/20 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full space-y-4">
          <h3 className="font-medium text-lg text-red-600">
            Transaction Failed
          </h3>
          <p className="text-gray-600">
            There was an error processing your transaction.
          </p>
          <div className="text-center">
            <a
              href={getExplorerUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 underline"
            >
              View on Etherscan
            </a>
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose} variant="primary">
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
