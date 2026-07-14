import { useCallback, useState } from "react";
import {
  useAccount,
  usePublicClient,
  useSignTypedData,
  useWriteContract,
} from "wagmi";
import type { Address, Hash } from "viem";
import { ammoBatchRedeemerAbi } from "@/abi/ammoBatchRedeemer";
import { ammoTokenAbi } from "@/abi/ammoToken";
import {
  SEPOLIA_CONFIG,
  SUPPORTED_CHAIN_ID,
  isSupportedChainId,
} from "@/addresses";
import { encryptShippingPayload } from "@/data/shipping-encryption";
import type { ShippingData } from "@/data/shipping-validation";
import {
  buildShippingPayload,
  createPermitDeadline,
  createPermitTypedData,
  splitPermitSignature,
  type CanonicalLineItem,
} from "@/utils/shippingRedemption";

export type ShippingRedemptionStatus =
  | "idle"
  | "encrypting"
  | "reading-permits"
  | "signing-permits"
  | "submitting"
  | "confirming"
  | "success"
  | "error";

interface OperationState {
  status: ShippingRedemptionStatus;
  error: Error | null;
  txHash: Hash | null;
  signedPermits: number;
  totalPermits: number;
}

const INITIAL_STATE: OperationState = {
  status: "idle",
  error: null,
  txHash: null,
  signedPermits: 0,
  totalPermits: 0,
};

function safeOperationError(
  error: unknown,
  status: ShippingRedemptionStatus
): Error {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (
    message.includes("user rejected") ||
    message.includes("user denied") ||
    message.includes("rejected by user")
  ) {
    return new Error(
      status === "signing-permits"
        ? "Permit signature request was cancelled."
        : "Redemption transaction was cancelled."
    );
  }
  return new Error(
    status === "signing-permits"
      ? "A permit could not be signed. No redemption transaction was submitted."
      : "Shipping redemption failed. Confirm your balances and try again."
  );
}

export function useShippingRedemption() {
  const { address: account, chainId, isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId: SUPPORTED_CHAIN_ID });
  const { signTypedDataAsync } = useSignTypedData();
  const { writeContractAsync } = useWriteContract();
  const [operation, setOperation] = useState<OperationState>(INITIAL_STATE);

  const redeemerAddress: Address | undefined =
    SEPOLIA_CONFIG.contracts.ammoBatchRedeemer;
  const disabledReason = !isConnected
    ? "Connect a wallet to ship ammunition."
    : !isSupportedChainId(chainId)
      ? "Shipping supports Sepolia only."
      : !redeemerAddress
        ? "Shipping is unavailable until the batch redeemer is deployed."
        : !publicClient
          ? "Sepolia connection is unavailable."
          : null;

  const reset = useCallback(() => setOperation(INITIAL_STATE), []);

  const redeem = useCallback(
    async (
      shipping: ShippingData,
      lineItems: readonly CanonicalLineItem[]
    ): Promise<Hash> => {
      if (!account || !isConnected) {
        throw new Error("Connect a wallet to ship ammunition.");
      }
      if (!isSupportedChainId(chainId)) {
        throw new Error("Shipping supports Sepolia only.");
      }
      if (!redeemerAddress) {
        throw new Error(
          "Shipping is unavailable until the batch redeemer is deployed."
        );
      }
      if (!publicClient) {
        throw new Error("Sepolia connection is unavailable.");
      }

      let activeStatus: ShippingRedemptionStatus = "encrypting";
      setOperation({
        status: activeStatus,
        error: null,
        txHash: null,
        signedPermits: 0,
        totalPermits: lineItems.length,
      });

      try {
        const payload = buildShippingPayload(shipping, lineItems);
        const encryptedPayload = await encryptShippingPayload(
          JSON.stringify(payload)
        );

        activeStatus = "reading-permits";
        setOperation((current) => ({ ...current, status: activeStatus }));
        const permitInputs = await Promise.all(
          lineItems.map(async (item) => {
            const [tokenName, nonce, balance] = await Promise.all([
              publicClient.readContract({
                address: item.token,
                abi: ammoTokenAbi,
                functionName: "name",
              }),
              publicClient.readContract({
                address: item.token,
                abi: ammoTokenAbi,
                functionName: "nonces",
                args: [account],
              }),
              publicClient.readContract({
                address: item.token,
                abi: ammoTokenAbi,
                functionName: "balanceOf",
                args: [account],
              }),
            ]);

            if (balance < item.baseAmount) {
              throw new Error(`Insufficient ${item.symbol} balance.`);
            }
            return { item, tokenName, nonce };
          })
        );

        const deadline = createPermitDeadline(Math.floor(Date.now() / 1000));
        const signedItems = [];
        for (const [index, permitInput] of permitInputs.entries()) {
          activeStatus = "signing-permits";
          setOperation((current) => ({
            ...current,
            status: activeStatus,
            signedPermits: index,
          }));
          const signature = await signTypedDataAsync(
            createPermitTypedData({
              chainId: SUPPORTED_CHAIN_ID,
              token: permitInput.item.token,
              tokenName: permitInput.tokenName,
              owner: account,
              spender: redeemerAddress,
              value: permitInput.item.baseAmount,
              nonce: permitInput.nonce,
              deadline,
            })
          );
          const { v, r, s } = splitPermitSignature(signature);
          signedItems.push({
            token: permitInput.item.token,
            amount: permitInput.item.baseAmount,
            deadline,
            v,
            r,
            s,
          });
          setOperation((current) => ({
            ...current,
            signedPermits: index + 1,
          }));
        }

        activeStatus = "submitting";
        setOperation((current) => ({ ...current, status: activeStatus }));
        const txHash = await writeContractAsync({
          address: redeemerAddress,
          abi: ammoBatchRedeemerAbi,
          functionName: "redeem",
          args: [signedItems, encryptedPayload],
          chainId: SUPPORTED_CHAIN_ID,
        });

        activeStatus = "confirming";
        setOperation((current) => ({
          ...current,
          status: activeStatus,
          txHash,
        }));
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });
        if (receipt.status !== "success") {
          throw new Error("Redemption transaction reverted.");
        }

        setOperation((current) => ({ ...current, status: "success" }));
        return txHash;
      } catch (error) {
        const safeError = safeOperationError(error, activeStatus);
        setOperation((current) => ({
          ...current,
          status: "error",
          error: safeError,
        }));
        throw safeError;
      }
    },
    [
      account,
      chainId,
      isConnected,
      publicClient,
      redeemerAddress,
      signTypedDataAsync,
      writeContractAsync,
    ]
  );

  return {
    ...operation,
    disabledReason,
    canRedeem: disabledReason === null,
    redeem,
    reset,
  };
}
