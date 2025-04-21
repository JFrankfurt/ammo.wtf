// Create a simplified version of TransactionStates for this component
import { WalletErrorDisplay } from "./WalletErrorDisplay";
import { getExplorerUrl } from "../utils/blockExplorer";

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
  error: unknown;
  hash?: `0x${string}`;
  chainId?: number;
}) => {
  if (!hash && !error && !isPending && !isConfirming) return null;

  return (
    <div className="p-3 bg-muted/10 border border-border rounded-none text-xs space-y-2">
      {isPending && (
        <div className="flex items-center text-muted font-mono">
          <svg
            className="animate-spin h-3.5 w-3.5 mr-2 text-accentGreen"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              d="M12 2 L12 5 M12 19 L12 22 M5 12 L2 12 M22 12 L19 12 M19.07 4.93 L16.95 7.05 M7.05 16.95 L4.93 19.07 M19.07 19.07 L16.95 16.95 M7.05 7.05 L4.93 4.93"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span>Waiting for wallet confirmation...</span>
        </div>
      )}

      {isConfirming && (
        <div className="flex items-center text-muted font-mono">
          <svg
            className="animate-spin h-3.5 w-3.5 mr-2 text-accentGreen"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              d="M12 2 L12 5 M12 19 L12 22 M5 12 L2 12 M22 12 L19 12 M19.07 4.93 L16.95 7.05 M7.05 16.95 L4.93 19.07 M19.07 19.07 L16.95 16.95 M7.05 7.05 L4.93 4.93"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span>Transaction confirming...</span>
        </div>
      )}

      {isError && <WalletErrorDisplay error={error} />}

      {hash && (
        <div className="text-muted font-mono">
          <a
            href={`${getExplorerUrl(chainId)}/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accentGreen hover:underline"
          >
            View transaction ↗
          </a>
        </div>
      )}
    </div>
  );
};
