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
  DEFAULT_CHAIN_ID,
  getChainConfig,
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
  const chainConfig = getChainConfig(chainId);
  const publicClient = usePublicClient({
    chainId: chainConfig?.chainId ?? DEFAULT_CHAIN_ID,
  });
  const { signTypedDataAsync } = useSignTypedData();
  const { writeContractAsync } = useWriteContract();
  const [operation, setOperation] = useState<OperationState>(INITIAL_STATE);

  const redeemerAddress: Address | undefined =
    chainConfig?.contracts.ammoBatchRedeemer;
  const disabledReason = !isConnected
    ? "Connect a wallet to ship ammunition."
    : !isSupportedChainId(chainId)
      ? "Shipping is not supported on this network."
      : !redeemerAddress
        ? "Shipping is unavailable until the batch redeemer is deployed."
        : !publicClient
          ? "Network connection is unavailable."
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
      if (!isSupportedChainId(chainId) || !chainConfig) {
        throw new Error("Shipping is not supported on this network.");
      }
      if (!redeemerAddress) {
        throw new Error(
          "Shipping is unavailable until the batch redeemer is deployed."
        );
      }
      if (!publicClient) {
        throw new Error("Network connection is unavailable.");
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
              chainId: chainConfig.chainId,
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
          chainId: chainConfig.chainId,
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
      chainConfig,
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
