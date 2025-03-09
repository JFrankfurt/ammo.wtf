// Create a simplified version of TransactionStates for this component
export const SimpleTransactionStatus = ({
  isPending,
  isConfirming,
  isConfirmed,
  isError,
  error,
  hash,
  chainId,
}: {
  isPending: boolean;
  isConfirming: boolean;
  isConfirmed: boolean;
  isError: boolean;
  error: string | null;
  hash?: `0x${string}`;
  chainId?: number;
}) => {
  if (!hash && !error && !isPending) return null;

  return (
    <div className="mt-4 p-3 rounded-lg border">
      {isPending && (
        <div className="flex items-center text-blue-600">
          <span className="mr-2">Waiting for confirmation...</span>
          <span className="animate-spin">⏳</span>
        </div>
      )}

      {isConfirming && (
        <div className="flex items-center text-blue-600">
          <span className="mr-2">Transaction confirming...</span>
          <span className="animate-spin">⏳</span>
        </div>
      )}

      {isError && (
        <div className="text-red-600">
          {error || "Transaction failed. Please try again."}
        </div>
      )}

      {hash && (
        <div className="text-sm text-gray-600">
          <a
            href={`https://${
              chainId === 1 ? "" : "sepolia."
            }etherscan.io/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            View transaction
          </a>
        </div>
      )}
    </div>
  );
};
