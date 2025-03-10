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
      className={`rounded-lg border border-red-200 bg-red-50 p-4 ${className}`}
    >
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
        <span className="font-medium text-red-700">{formattedError.title}</span>
      </div>

      <p className="text-gray-700 mb-2">{formattedError.message}</p>

      {formattedError.details && (
        <div className="mt-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
          >
            {showDetails ? "Hide details" : "Show details"}
          </button>

          {showDetails && (
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono overflow-x-auto max-h-32 text-gray-700">
              {formattedError.details}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
