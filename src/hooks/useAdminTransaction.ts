import { useCallback, useState } from "react";
import type { Hash } from "viem";
import { useWaitForTransactionReceipt } from "wagmi";

type SubmitTransaction = () => Promise<Hash>;

export function useAdminTransaction() {
  const [hash, setHash] = useState<Hash>();
  const [submissionError, setSubmissionError] = useState<unknown>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const receipt = useWaitForTransactionReceipt({ hash });

  const execute = useCallback(async (submit: SubmitTransaction) => {
    setHash(undefined);
    setSubmissionError(undefined);
    setIsSubmitting(true);

    try {
      const nextHash = await submit();
      setHash(nextHash);
      return nextHash;
    } catch (error) {
      setSubmissionError(error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setHash(undefined);
    setSubmissionError(undefined);
    setIsSubmitting(false);
  }, []);

  const error = submissionError ?? receipt.error;
  const status = error
    ? "error"
    : receipt.isSuccess
      ? "success"
      : isSubmitting || Boolean(hash)
        ? "pending"
        : "idle";

  return {
    status,
    hash,
    error,
    isBusy: status === "pending",
    execute,
    reset,
  } as const;
}
