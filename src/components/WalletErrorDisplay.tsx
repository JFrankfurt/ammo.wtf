import { useState } from "react";
import { formatWalletError } from "../utils/walletErrors";

interface WalletErrorDisplayProps {
  error: unknown;
  className?: string;
}

export const WalletErrorDisplay = ({
  error,
  className = "",
}: WalletErrorDisplayProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const formattedError = formatWalletError(error);

  if (!error) return null;

  return (
    <div
      className={`rounded-none border border-destructive bg-destructive/10 p-3 text-xs ${className}`}
    >
      <div className="flex items-center mb-1">
        <svg
          className="w-4 h-4 text-destructive mr-2 flex-shrink-0"
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
        <span className="font-medium font-mono text-destructive">
          {formattedError.title}
        </span>
      </div>

      <p className="text-muted font-mono mb-1.5 ml-6">
        {formattedError.message}
      </p>

      {formattedError.details && (
        <div className="mt-1.5 ml-6">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs font-mono text-muted hover:text-foreground underline focus:outline-none"
          >
            {showDetails ? "Hide details" : "Show details"}
          </button>

          {showDetails && (
            <div className="mt-1.5 p-2 bg-muted/20 rounded-none border border-border text-xs font-mono overflow-x-auto max-h-32 text-muted">
              {formattedError.details}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
