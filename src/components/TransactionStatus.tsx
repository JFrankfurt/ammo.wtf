import type { Hash } from "viem";
import { getChainConfig } from "@/addresses";
import { WalletErrorDisplay } from "./WalletErrorDisplay";

export type TransactionStatusKind = "idle" | "pending" | "success" | "error";

interface TransactionStatusProps {
  status: TransactionStatusKind;
  message?: string;
  error?: unknown;
  errorMessage?: string;
  hash?: Hash | null;
  chainId?: number;
}

export function TransactionStatus({
  status,
  message,
  error,
  errorMessage,
  hash,
  chainId,
}: TransactionStatusProps) {
  if (status === "idle") return null;

  const explorerUrl = getChainConfig(chainId)?.explorerUrl;

  return (
    <div className="space-y-2">
      {status === "error" ? (
        errorMessage ? (
          <div
            role="alert"
            className="border border-destructive bg-destructive/10 p-3 text-xs font-mono text-destructive"
          >
            {errorMessage}
          </div>
        ) : (
          <WalletErrorDisplay error={error ?? "Transaction failed."} />
        )
      ) : (
        <div
          role="status"
          aria-live="polite"
          className={
            status === "success"
              ? "border border-accentGreen bg-accentGreen/10 p-3 text-xs font-mono text-accentGreen"
              : "border border-border bg-muted/10 p-3 text-xs font-mono text-muted"
          }
        >
          {status === "pending" && (
            <span
              aria-hidden="true"
              className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-b border-accentGreen"
            />
          )}
          {message ??
            (status === "success"
              ? "Transaction confirmed."
              : "Transaction pending…")}
        </div>
      )}

      {hash && explorerUrl && (
        <a
          href={`${explorerUrl}/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs font-mono text-accentGreen hover:underline"
        >
          View transaction ↗
        </a>
      )}
    </div>
  );
}
