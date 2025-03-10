/**
 * Utility functions for handling wallet errors
 */

type ParsedWalletError = {
  title: string;
  message: string;
  details?: string;
  isUserRejection: boolean;
};

/**
 * Parses a wallet error message into a more user-friendly format
 * @param error The error message or object from the wallet
 * @returns A parsed error object with user-friendly messages
 */
export function parseWalletError(error: unknown): ParsedWalletError {
  // Default error response
  const defaultError: ParsedWalletError = {
    title: "Transaction Failed",
    message: "There was an error processing your transaction.",
    isUserRejection: false,
  };

  if (!error) return defaultError;

  // Convert error to string if it's not already
  const errorString =
    typeof error === "string"
      ? error
      : error instanceof Error
      ? error.message
      : JSON.stringify(error);

  // Check for user rejection patterns
  if (
    errorString.includes("User denied transaction signature") ||
    errorString.includes("User rejected the request") ||
    errorString.includes("user rejected transaction") ||
    errorString.includes("rejected by user")
  ) {
    return {
      title: "Transaction Cancelled",
      message: "You cancelled the transaction.",
      isUserRejection: true,
    };
  }

  // Check for insufficient funds
  if (
    errorString.includes("insufficient funds") ||
    errorString.includes("InsufficientFunds") ||
    errorString.includes("insufficient balance")
  ) {
    return {
      title: "Insufficient Funds",
      message: "You don't have enough funds to complete this transaction.",
      isUserRejection: false,
    };
  }

  // Check for gas related errors
  if (
    errorString.includes("gas required exceeds allowance") ||
    errorString.includes("out of gas") ||
    errorString.includes("gas limit")
  ) {
    return {
      title: "Gas Error",
      message: "There was an issue with the gas for this transaction.",
      isUserRejection: false,
    };
  }

  // Check for nonce errors
  if (errorString.includes("nonce")) {
    return {
      title: "Nonce Error",
      message: "There was an issue with the transaction sequence.",
      isUserRejection: false,
    };
  }

  // Check for contract errors
  if (errorString.includes("execution reverted")) {
    // Extract the revert reason if available
    const revertMatch = errorString.match(/execution reverted: (.*?)(?:$|")/);
    const revertReason = revertMatch
      ? revertMatch[1]
      : "Contract execution failed";

    return {
      title: "Contract Error",
      message: "The transaction was rejected by the smart contract.",
      details: revertReason,
      isUserRejection: false,
    };
  }

  // For MetaMask detailed errors, try to extract useful information
  if (errorString.includes("MetaMask Tx Signature:")) {
    // Extract the specific error message after "MetaMask Tx Signature:"
    const metaMaskMatch = errorString.match(
      /MetaMask Tx Signature: (.*?)(?:$|\. Version)/
    );
    const metaMaskError = metaMaskMatch ? metaMaskMatch[1] : null;

    if (metaMaskError) {
      return {
        title: "Transaction Failed",
        message: metaMaskError,
        details: "See details for more information",
        isUserRejection: metaMaskError.includes("User denied"),
      };
    }
  }

  // For contract call details, try to extract function information
  if (
    errorString.includes("Contract Call:") &&
    errorString.includes("function:")
  ) {
    try {
      const functionMatch = errorString.match(/function: ([^)]+)\(/);
      const functionName = functionMatch
        ? functionMatch[1]
        : "unknown function";

      return {
        title: "Transaction Failed",
        message: `Failed to execute ${functionName}`,
        details: "The contract call failed to execute",
        isUserRejection: false,
      };
    } catch (e) {
      // If parsing fails, fall back to default
    }
  }

  // If we couldn't identify a specific error, return a generic message
  // but include the original error as details for debugging
  return {
    ...defaultError,
    details:
      errorString.length > 100
        ? `${errorString.substring(0, 100)}...`
        : errorString,
  };
}

/**
 * Formats a wallet error for display in the UI
 * @param error The error message or object from the wallet
 * @returns A formatted error object with user-friendly messages
 */
export function formatWalletError(error: unknown): {
  title: string;
  message: string;
  details?: string;
} {
  const parsedError = parseWalletError(error);
  return {
    title: parsedError.title,
    message: parsedError.message,
    details: parsedError.details,
  };
}
