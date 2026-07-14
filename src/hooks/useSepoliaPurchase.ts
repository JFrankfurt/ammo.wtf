import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useBalance,
  useChainId,
  useConfig,
  usePublicClient,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { readContract } from "@wagmi/core";
import {
  type Abi,
  formatUnits,
  parseAbi,
  type Address,
  type Hash,
} from "viem";
import { ammoTokenAbi } from "@/abi/ammoToken";
import v4QuoterAbi from "@/abi/v4Quoter";
import { UNIVERSAL_ROUTER_ABI } from "@/abi/universalRouter";
import {
  SEPOLIA_CONFIG,
  SUPPORTED_CHAIN_ID,
  isSupportedChainId,
} from "@/addresses";
import {
  DEFAULT_SLIPPAGE_BPS,
  assertPermit2Amount,
  calculateMinimumOutput,
  calculatePurchaseAmounts,
  deriveV4PoolConfig,
  encodeV4ExactInputSingle,
  getPurchaseDisabledReason,
  needsExactErc20Allowance,
  needsExactPermit2Allowance,
  type PurchaseStatus,
} from "@/utils/purchaseSwap";

const PERMIT2_ABI = parseAbi([
  "function allowance(address owner, address token, address spender) view returns (uint160 amount, uint48 expiration, uint48 nonce)",
  "function approve(address token, address spender, uint160 amount, uint48 expiration)",
]);
const V4_QUOTER_ABI = v4QuoterAbi as Abi;
const PERMIT2_ALLOWANCE_SECONDS = 20 * 60;
const SWAP_DEADLINE_SECONDS = 10 * 60;

interface UseSepoliaPurchaseArgs {
  subtotalInput: string;
  tokenOut: Address;
  slippageBps?: number;
  enabled?: boolean;
  onSuccess?: (txHash: Hash) => void;
  onError?: (error: Error) => void;
}

interface OperationState {
  status: PurchaseStatus;
  error: Error | null;
  txHash: Hash | null;
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export function useSepoliaPurchase({
  subtotalInput,
  tokenOut,
  slippageBps = DEFAULT_SLIPPAGE_BPS,
  enabled = true,
  onSuccess,
  onError,
}: UseSepoliaPurchaseArgs) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const config = useConfig();
  const publicClient = usePublicClient({ chainId: SUPPORTED_CHAIN_ID });
  const { writeContractAsync } = useWriteContract();
  const [operation, setOperation] = useState<OperationState>({
    status: "idle",
    error: null,
    txHash: null,
  });

  const calculation = useMemo(() => {
    try {
      return {
        amounts: calculatePurchaseAmounts(
          subtotalInput,
          SEPOLIA_CONFIG.decimals.usdc
        ),
        error: null,
      };
    } catch (error) {
      return {
        amounts: calculatePurchaseAmounts(
          "",
          SEPOLIA_CONFIG.decimals.usdc
        ),
        error: toError(error),
      };
    }
  }, [subtotalInput]);

  const pool = useMemo(
    () =>
      deriveV4PoolConfig({
        chainId: SUPPORTED_CHAIN_ID,
        tokenIn: SEPOLIA_CONFIG.contracts.usdc,
        tokenOut,
        tokenInDecimals: SEPOLIA_CONFIG.decimals.usdc,
        tokenOutDecimals: SEPOLIA_CONFIG.decimals.ammoToken,
        fee: SEPOLIA_CONFIG.pool.fee,
        tickSpacing: SEPOLIA_CONFIG.pool.tickSpacing,
        hooks: SEPOLIA_CONFIG.pool.hooks,
      }),
    [tokenOut]
  );

  const quoteEnabled =
    enabled &&
    isSupportedChainId(chainId) &&
    calculation.error === null &&
    calculation.amounts.totalAmount > 0n;
  const quoteParams = {
    poolKey: pool.poolKey,
    zeroForOne: pool.zeroForOne,
    exactAmount: calculation.amounts.totalAmount,
    hookData: "0x" as const,
  };
  const quoteQuery = useReadContract({
    address: SEPOLIA_CONFIG.contracts.v4Quoter,
    abi: V4_QUOTER_ABI,
    functionName: "quoteExactInputSingle",
    args: [quoteParams],
    chainId: SUPPORTED_CHAIN_ID,
    query: {
      enabled: quoteEnabled,
      retry: false,
    },
  });
  const quoteData = quoteQuery.data as readonly [bigint, bigint] | undefined;
  const quote = quoteData?.[0] ?? null;

  const usdcBalanceQuery = useBalance({
    address,
    token: SEPOLIA_CONFIG.contracts.usdc,
    chainId: SUPPORTED_CHAIN_ID,
    query: { enabled: isConnected && isSupportedChainId(chainId) },
  });
  const outputBalanceQuery = useBalance({
    address,
    token: tokenOut,
    chainId: SUPPORTED_CHAIN_ID,
    query: { enabled: isConnected && isSupportedChainId(chainId) },
  });
  const usdcBalance = usdcBalanceQuery.data?.value ?? 0n;
  const hasSufficientBalance =
    calculation.amounts.totalAmount > 0n &&
    usdcBalance >= calculation.amounts.totalAmount;

  const isTransactionPending =
    operation.status === "approving-erc20" ||
    operation.status === "approving-permit2" ||
    operation.status === "swapping";
  const quoteError =
    calculation.error ??
    (quoteQuery.error ? toError(quoteQuery.error) : null);
  const status: PurchaseStatus =
    operation.status === "success" ||
    operation.status === "error" ||
    isTransactionPending
      ? operation.status
      : quoteQuery.isFetching
      ? "quoting"
      : quote
      ? "ready"
      : "idle";
  const disabledReason = getPurchaseDisabledReason({
    isConnected,
    isSupportedChain: isSupportedChainId(chainId),
    hasAmount: calculation.amounts.totalAmount > 0n,
    isQuoting: quoteQuery.isFetching,
    hasQuote: quote !== null,
    hasQuoteError: quoteError !== null,
    hasSufficientBalance,
    status,
  });

  useEffect(() => {
    setOperation({ status: "idle", error: null, txHash: null });
  }, [subtotalInput, tokenOut, slippageBps]);

  const waitForSuccess = useCallback(
    async (hash: Hash) => {
      if (!publicClient) {
        throw new Error("Sepolia public client is unavailable.");
      }
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") {
        throw new Error(`Transaction ${hash} reverted.`);
      }
    },
    [publicClient]
  );

  const executePurchase = useCallback(async () => {
    try {
      if (!address || !isConnected) {
        throw new Error("Connect a wallet before purchasing.");
      }
      if (!isSupportedChainId(chainId)) {
        throw new Error("Purchase supports Sepolia only.");
      }
      if (!publicClient) {
        throw new Error("Sepolia public client is unavailable.");
      }
      if (calculation.error || calculation.amounts.totalAmount <= 0n) {
        throw calculation.error ?? new Error("Enter a purchase amount.");
      }
      assertPermit2Amount(calculation.amounts.totalAmount);

      const refreshedBalance = await usdcBalanceQuery.refetch();
      const currentBalance = refreshedBalance.data?.value ?? 0n;
      if (currentBalance < calculation.amounts.totalAmount) {
        throw new Error(
          `Insufficient USDC balance. Required ${calculation.amounts.total} USDC.`
        );
      }

      setOperation({ status: "quoting", error: null, txHash: null });
      const refreshedQuote = await quoteQuery.refetch();
      const quotedOutput = (
        refreshedQuote.data as readonly [bigint, bigint] | undefined
      )?.[0];
      if (!quotedOutput || quotedOutput <= 0n) {
        throw refreshedQuote.error ?? new Error("No swap quote is available.");
      }
      const minimumOutput = calculateMinimumOutput(
        quotedOutput,
        slippageBps
      );

      const erc20Allowance = await readContract(config, {
        address: SEPOLIA_CONFIG.contracts.usdc,
        abi: ammoTokenAbi,
        functionName: "allowance",
        args: [address, SEPOLIA_CONFIG.contracts.permit2],
        chainId: SUPPORTED_CHAIN_ID,
      });
      if (
        needsExactErc20Allowance(
          erc20Allowance,
          calculation.amounts.totalAmount
        )
      ) {
        setOperation({
          status: "approving-erc20",
          error: null,
          txHash: null,
        });
        const approvalHash = await writeContractAsync({
          address: SEPOLIA_CONFIG.contracts.usdc,
          abi: ammoTokenAbi,
          functionName: "approve",
          args: [
            SEPOLIA_CONFIG.contracts.permit2,
            calculation.amounts.totalAmount,
          ],
          account: address,
          chainId: SUPPORTED_CHAIN_ID,
        });
        await waitForSuccess(approvalHash);
      }

      const now = Math.floor(Date.now() / 1_000);
      const permit2Expiration = now + PERMIT2_ALLOWANCE_SECONDS;
      const [permit2Allowance, currentExpiration] = await readContract(config, {
        address: SEPOLIA_CONFIG.contracts.permit2,
        abi: PERMIT2_ABI,
        functionName: "allowance",
        args: [
          address,
          SEPOLIA_CONFIG.contracts.usdc,
          SEPOLIA_CONFIG.contracts.universalRouter,
        ],
        chainId: SUPPORTED_CHAIN_ID,
      });
      if (
        needsExactPermit2Allowance({
          currentAllowance: permit2Allowance,
          currentExpiration: Number(currentExpiration),
          requiredAmount: calculation.amounts.totalAmount,
          minimumExpiration: now + SWAP_DEADLINE_SECONDS,
        })
      ) {
        setOperation({
          status: "approving-permit2",
          error: null,
          txHash: null,
        });
        const permit2Hash = await writeContractAsync({
          address: SEPOLIA_CONFIG.contracts.permit2,
          abi: PERMIT2_ABI,
          functionName: "approve",
          args: [
            SEPOLIA_CONFIG.contracts.usdc,
            SEPOLIA_CONFIG.contracts.universalRouter,
            calculation.amounts.totalAmount,
            permit2Expiration,
          ],
          account: address,
          chainId: SUPPORTED_CHAIN_ID,
        });
        await waitForSuccess(permit2Hash);
      }

      const encodedSwap = encodeV4ExactInputSingle({
        pool,
        amountIn: calculation.amounts.totalAmount,
        amountOutMinimum: minimumOutput,
      });
      setOperation({ status: "swapping", error: null, txHash: null });
      const swapHash = await writeContractAsync({
        address: SEPOLIA_CONFIG.contracts.universalRouter,
        abi: UNIVERSAL_ROUTER_ABI,
        functionName: "execute",
        args: [
          encodedSwap.commands,
          [...encodedSwap.inputs],
          BigInt(now + SWAP_DEADLINE_SECONDS),
        ],
        account: address,
        chainId: SUPPORTED_CHAIN_ID,
      });
      await waitForSuccess(swapHash);

      setOperation({ status: "success", error: null, txHash: swapHash });
      await Promise.all([
        usdcBalanceQuery.refetch(),
        outputBalanceQuery.refetch(),
      ]);
      onSuccess?.(swapHash);
      return swapHash;
    } catch (error) {
      const purchaseError = toError(error);
      setOperation({
        status: "error",
        error: purchaseError,
        txHash: null,
      });
      onError?.(purchaseError);
      throw purchaseError;
    }
  }, [
    address,
    calculation,
    chainId,
    config,
    isConnected,
    onError,
    onSuccess,
    outputBalanceQuery,
    pool,
    publicClient,
    quoteQuery,
    slippageBps,
    usdcBalanceQuery,
    waitForSuccess,
    writeContractAsync,
  ]);

  return {
    amounts: calculation.amounts,
    quote,
    minimumOutput:
      quote === null ? null : calculateMinimumOutput(quote, slippageBps),
    quoteFormatted:
      quote === null
        ? null
        : formatUnits(quote, SEPOLIA_CONFIG.decimals.ammoToken),
    usdcBalance,
    usdcBalanceFormatted: formatUnits(
      usdcBalance,
      SEPOLIA_CONFIG.decimals.usdc
    ),
    hasSufficientBalance,
    status,
    error: operation.error ?? quoteError,
    txHash: operation.txHash,
    disabledReason,
    canPurchase: isConnected ? disabledReason === null : true,
    executePurchase,
    refreshQuote: quoteQuery.refetch,
  };
}
