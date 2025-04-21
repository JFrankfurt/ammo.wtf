import { useWaitForTransactionReceipt } from "wagmi";
import { Button } from "./Button";
import { getExplorerUrl } from "../utils/blockExplorer";
import { WalletErrorDisplay } from "./WalletErrorDisplay";

interface TransactionStatesProps {
  hash: `0x${string}` | undefined;
  onClose: () => void;
  chainId: number;
  error?: unknown;
}

const Spinner = ({ className = "" }: { className?: string }) => (
  <svg
    className={`animate-spin h-5 w-5 ${className}`}
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
);

export const TransactionStates = ({
  hash,
  onClose,
  chainId,
  error,
}: TransactionStatesProps) => {
  const { isLoading, isSuccess, isError } = useWaitForTransactionReceipt({
    hash,
  });

  if (!hash && !error) {
    // Initial state: Waiting for user interaction in wallet
    return (
      // Use themed backdrop
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        {/* Use themed panel */}
        <div className="bg-background border border-border rounded-none p-6 max-w-md w-full space-y-4">
          {/* Themed title and text */}
          <h3 className="font-bold text-lg font-mono text-foreground">
            Confirm Transaction
          </h3>
          <p className="text-sm text-muted font-mono">
            Please confirm the transaction in your wallet...
          </p>
          <div className="flex justify-center py-4">
            <Spinner className="text-accentGreen" />
          </div>
          {/* Error display if initial error occurred (e.g., before hash generated) */}
          {error && <WalletErrorDisplay error={error} />}
          {/* Themed button */}
          <div className="flex justify-end pt-4 border-t border-border">
            <Button onClick={onClose} variant="secondary">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // States when hash exists
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-none p-6 max-w-md w-full space-y-4">
        {/* Loading State */}
        {isLoading && (
          <>
            <h3 className="font-bold text-lg font-mono text-foreground">
              Transaction Pending
            </h3>
            <p className="text-sm text-muted font-mono">
              Your transaction is processing on the blockchain...
            </p>
            <div className="flex justify-center py-4">
              <Spinner className="text-accentGreen" />
            </div>
          </>
        )}

        {/* Success State */}
        {isSuccess && (
          <>
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-accentGreen flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <h3 className="font-bold text-lg font-mono text-accentGreen">
                Success!
              </h3>
            </div>
            <p className="text-sm text-muted font-mono">
              Transaction confirmed successfully.
              {/* Add more specific success message if needed */}
            </p>
          </>
        )}

        {/* Error State */}
        {isError && (
          <>
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-destructive flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <h3 className="font-bold text-lg font-mono text-destructive">
                Transaction Failed
              </h3>
            </div>
            {/* Use themed WalletErrorDisplay */}
            <WalletErrorDisplay error={error || "An unknown error occurred"} />
          </>
        )}

        {/* Transaction Link (always show if hash exists) */}
        {hash && (
          <div className="text-center text-xs font-mono">
            <a
              href={`${getExplorerUrl(chainId)}/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accentGreen hover:underline"
            >
              View on Block Explorer ↗
            </a>
          </div>
        )}

        {/* Close button (always show if hash exists) */}
        <div className="flex justify-end pt-4 border-t border-border">
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </div>
  );

  // Should not be reached if logic is correct, but added for completeness
  return null;
};
