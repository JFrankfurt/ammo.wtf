import { useState, useCallback } from "react";
import { parseWalletError } from "../utils/walletErrors";

/**
 * Hook for handling wallet errors in a standardized way across the application
 * @returns An object with error state and functions to handle errors
 */
export function useWalletErrorHandler() {
  const [error, setError] = useState<unknown>(null);
  const [isUserRejection, setIsUserRejection] = useState(false);

  /**
   * Handle a wallet error
   * @param err The error to handle
   * @returns The parsed error object
   */
  const handleError = useCallback((err: unknown) => {
    const parsedError = parseWalletError(err);
    setError(err);
    setIsUserRejection(parsedError.isUserRejection);
    return parsedError;
  }, []);

  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setError(null);
    setIsUserRejection(false);
  }, []);

  return {
    error,
    isUserRejection,
    handleError,
    clearError,
  };
}
