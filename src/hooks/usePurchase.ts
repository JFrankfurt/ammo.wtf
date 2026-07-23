import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useBalance,
  useChainId,
  useConfig,
  usePublicClient,
  useReadContract,
  useSignTypedData,
  useWriteContract,
} from "wagmi";
import { readContract } from "@wagmi/core";
import {
  type Abi,
  formatUnits,
  maxUint256,
  parseAbi,
  type Address,
  type Hash,
  type Hex,
} from "viem";
import { ammoTokenAbi } from "@/abi/ammoToken";
import v4QuoterAbi from "@/abi/v4Quoter";
import { UNIVERSAL_ROUTER_ABI } from "@/abi/universalRouter";
import {
  DEFAULT_CHAIN_CONFIG,
  getChainConfig,
  isSupportedChainId,
} from "@/addresses";
import {
  DEFAULT_SLIPPAGE_BPS,
  assertPermit2Amount,
  buildPermit2TypedData,
  calculateMinimumOutput,
  calculatePurchaseAmounts,
  deriveV4PoolConfig,
  encodeV4ExactInputSingle,
  getPurchaseDisabledReason,
  needsErc20Allowance,
  needsPermit2Signature,
  type Permit2Single,
  type PurchaseStatus,
} from "@/utils/purchaseSwap";

const PERMIT2_ABI = parseAbi([
  "function allowance(address owner, address token, address spender) view returns (uint160 amount, uint48 expiration, uint48 nonce)",
]);
const V4_QUOTER_ABI = v4QuoterAbi as Abi;
const PERMIT2_ALLOWANCE_SECONDS = 20 * 60;
const SWAP_DEADLINE_SECONDS = 10 * 60;

interface UsePurchaseArgs {
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

export function usePurchase({
  subtotalInput,
  tokenOut,
  slippageBps = DEFAULT_SLIPPAGE_BPS,
  enabled = true,
  onSuccess,
  onError,
}: UsePurchaseArgs) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const chainConfig = getChainConfig(chainId) ?? DEFAULT_CHAIN_CONFIG;
  const activeChainId = chainConfig.chainId;
  const config = useConfig();
  const publicClient = usePublicClient({ chainId: activeChainId });
  const { writeContractAsync } = useWriteContract();
  const { signTypedDataAsync } = useSignTypedData();
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
          chainConfig.decimals.usdc
        ),
        error: null,
      };
    } catch (error) {
      return {
        amounts: calculatePurchaseAmounts("", chainConfig.decimals.usdc),
        error: toError(error),
      };
    }
  }, [subtotalInput, chainConfig]);

  const pool = useMemo(
    () =>
      deriveV4PoolConfig({
        chainId: activeChainId,
        tokenIn: chainConfig.contracts.usdc,
        tokenOut,
        tokenInDecimals: chainConfig.decimals.usdc,
        tokenOutDecimals: chainConfig.decimals.ammoToken,
        fee: chainConfig.pool.fee,
        tickSpacing: chainConfig.pool.tickSpacing,
        hooks: chainConfig.pool.hooks,
      }),
    [activeChainId, chainConfig, tokenOut]
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
    address: chainConfig.contracts.v4Quoter,
    abi: V4_QUOTER_ABI,
    functionName: "quoteExactInputSingle",
    args: [quoteParams],
    chainId: activeChainId,
    query: {
      enabled: quoteEnabled,
      retry: false,
    },
  });
  const quoteData = quoteQuery.data as readonly [bigint, bigint] | undefined;
  const quote = quoteData?.[0] ?? null;

  const usdcBalanceQuery = useBalance({
    address,
    token: chainConfig.contracts.usdc,
    chainId: activeChainId,
    query: { enabled: isConnected && isSupportedChainId(chainId) },
  });
  const outputBalanceQuery = useBalance({
    address,
    token: tokenOut,
    chainId: activeChainId,
    query: { enabled: isConnected && isSupportedChainId(chainId) },
  });
  const usdcBalance = usdcBalanceQuery.data?.value ?? 0n;
  const hasSufficientBalance =
    calculation.amounts.totalAmount > 0n &&
    usdcBalance >= calculation.amounts.totalAmount;

  const isTransactionPending =
    operation.status === "approving-erc20" ||
    operation.status === "signing-permit" ||
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
    setOperation((prev) => {
      // Never wipe status while a transaction is in flight — the debounced
      // amount input can change mid-approval and the tx is still on-chain.
      if (
        prev.status === "approving-erc20" ||
        prev.status === "signing-permit" ||
        prev.status === "swapping"
      ) {
        return prev;
      }
      return { status: "idle", error: null, txHash: null };
    });
  }, [subtotalInput, tokenOut, slippageBps]);

  const waitForSuccess = useCallback(
    async (hash: Hash) => {
      if (!publicClient) {
        throw new Error("Network connection is unavailable.");
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
        throw new Error("Purchase is not supported on this network.");
      }
      if (!publicClient) {
        throw new Error("Network connection is unavailable.");
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

      // One-time max approval: Permit2 gates actual spending per-swap via
      // short-lived signed permits, so an unbounded ERC20 allowance to
      // Permit2 itself is the standard Uniswap pattern.
      const erc20Allowance = await readContract(config, {
        address: chainConfig.contracts.usdc,
        abi: ammoTokenAbi,
        functionName: "allowance",
        args: [address, chainConfig.contracts.permit2],
        chainId: activeChainId,
      });
      if (
        needsErc20Allowance(
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
          address: chainConfig.contracts.usdc,
          abi: ammoTokenAbi,
          functionName: "approve",
          args: [chainConfig.contracts.permit2, maxUint256],
          account: address,
          chainId: activeChainId,
        });
        await waitForSuccess(approvalHash);
      }

      const now = Math.floor(Date.now() / 1_000);
      const [permit2Allowance, currentExpiration, permit2Nonce] =
        await readContract(config, {
          address: chainConfig.contracts.permit2,
          abi: PERMIT2_ABI,
          functionName: "allowance",
          args: [
            address,
            chainConfig.contracts.usdc,
            chainConfig.contracts.universalRouter,
          ],
          chainId: activeChainId,
        });
      let permit: { permitSingle: Permit2Single; signature: Hex } | undefined;
      if (
        needsPermit2Signature({
          currentAllowance: permit2Allowance,
          currentExpiration: Number(currentExpiration),
          requiredAmount: calculation.amounts.totalAmount,
          minimumExpiration: now + SWAP_DEADLINE_SECONDS,
        })
      ) {
        setOperation({
          status: "signing-permit",
          error: null,
          txHash: null,
        });
        const permitSingle: Permit2Single = {
          details: {
            token: chainConfig.contracts.usdc,
            amount: calculation.amounts.totalAmount,
            expiration: now + PERMIT2_ALLOWANCE_SECONDS,
            nonce: Number(permit2Nonce),
          },
          spender: chainConfig.contracts.universalRouter,
          sigDeadline: BigInt(now + SWAP_DEADLINE_SECONDS),
        };
        const signature = await signTypedDataAsync(
          buildPermit2TypedData({
            chainId: activeChainId,
            permit2: chainConfig.contracts.permit2,
            permit: permitSingle,
          })
        );
        permit = { permitSingle, signature };
      }

      const encodedSwap = encodeV4ExactInputSingle({
        pool,
        amountIn: calculation.amounts.totalAmount,
        amountOutMinimum: minimumOutput,
        permit,
      });
      setOperation({ status: "swapping", error: null, txHash: null });
      const swapHash = await writeContractAsync({
        address: chainConfig.contracts.universalRouter,
        abi: UNIVERSAL_ROUTER_ABI,
        functionName: "execute",
        args: [
          encodedSwap.commands,
          [...encodedSwap.inputs],
          BigInt(now + SWAP_DEADLINE_SECONDS),
        ],
        account: address,
        chainId: activeChainId,
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
    activeChainId,
    address,
    calculation,
    chainConfig,
    chainId,
    config,
    isConnected,
    onError,
    onSuccess,
    outputBalanceQuery,
    pool,
    publicClient,
    quoteQuery,
    signTypedDataAsync,
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
        : formatUnits(quote, chainConfig.decimals.ammoToken),
    usdcBalance,
    usdcBalanceFormatted: formatUnits(
      usdcBalance,
      chainConfig.decimals.usdc
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
