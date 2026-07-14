import { Actions, Pool, V4Planner, type PoolKey } from "@uniswap/v4-sdk";
import { Token } from "@uniswap/sdk-core";
import {
  CommandType,
  RoutePlanner,
} from "@uniswap/universal-router-sdk";
import {
  formatUnits,
  isAddress,
  parseUnits,
  type Address,
  type Hex,
} from "viem";

const BPS_DENOMINATOR = 10_000n;
const MAX_UINT128 = 2n ** 128n - 1n;
const MAX_UINT160 = 2n ** 160n - 1n;

export const PURCHASE_FEE_BPS = 1_000;
export const DEFAULT_SLIPPAGE_BPS = 500;

export interface PurchaseAmounts {
  subtotalAmount: bigint;
  feeAmount: bigint;
  totalAmount: bigint;
  subtotal: string;
  fee: string;
  total: string;
}

export interface V4PoolConfig {
  poolKey: PoolKey;
  zeroForOne: boolean;
  tokenIn: Address;
  tokenOut: Address;
}

export interface EncodedV4Swap {
  commands: Hex;
  inputs: readonly Hex[];
}

export type PurchaseStatus =
  | "idle"
  | "quoting"
  | "ready"
  | "approving-erc20"
  | "approving-permit2"
  | "swapping"
  | "success"
  | "error";

export interface PurchaseReadiness {
  isConnected: boolean;
  isSupportedChain: boolean;
  hasAmount: boolean;
  isQuoting: boolean;
  hasQuote: boolean;
  hasQuoteError: boolean;
  hasSufficientBalance: boolean;
  status: PurchaseStatus;
}

export function calculatePurchaseAmounts(
  subtotalInput: string,
  decimals = 6,
  feeBps = PURCHASE_FEE_BPS
): PurchaseAmounts {
  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > 10_000) {
    throw new Error("Fee must be between 0 and 10,000 basis points.");
  }

  const trimmedInput = subtotalInput.trim();
  const subtotalAmount = trimmedInput ? parseUnits(trimmedInput, decimals) : 0n;
  if (subtotalAmount < 0n) {
    throw new Error("Purchase amount cannot be negative.");
  }

  const feeAmount =
    (subtotalAmount * BigInt(feeBps) + BPS_DENOMINATOR / 2n) /
    BPS_DENOMINATOR;
  const totalAmount = subtotalAmount + feeAmount;

  return {
    subtotalAmount,
    feeAmount,
    totalAmount,
    subtotal: formatUnits(subtotalAmount, decimals),
    fee: formatUnits(feeAmount, decimals),
    total: formatUnits(totalAmount, decimals),
  };
}

export function deriveV4PoolConfig({
  chainId,
  tokenIn,
  tokenOut,
  tokenInDecimals,
  tokenOutDecimals,
  fee,
  tickSpacing,
  hooks,
}: {
  chainId: number;
  tokenIn: Address;
  tokenOut: Address;
  tokenInDecimals: number;
  tokenOutDecimals: number;
  fee: number;
  tickSpacing: number;
  hooks: Address;
}): V4PoolConfig {
  if (!isAddress(tokenIn) || !isAddress(tokenOut) || !isAddress(hooks)) {
    throw new Error("Pool configuration contains an invalid address.");
  }
  if (tokenIn.toLowerCase() === tokenOut.toLowerCase()) {
    throw new Error("Pool currencies must be different.");
  }

  const inputCurrency = new Token(
    chainId,
    tokenIn,
    tokenInDecimals
  );
  const outputCurrency = new Token(
    chainId,
    tokenOut,
    tokenOutDecimals
  );
  const poolKey = Pool.getPoolKey(
    inputCurrency,
    outputCurrency,
    fee,
    tickSpacing,
    hooks
  );

  return {
    poolKey,
    zeroForOne:
      poolKey.currency0.toLowerCase() === tokenIn.toLowerCase(),
    tokenIn,
    tokenOut,
  };
}

export function calculateMinimumOutput(
  quotedOutput: bigint,
  slippageBps = DEFAULT_SLIPPAGE_BPS
): bigint {
  if (
    !Number.isInteger(slippageBps) ||
    slippageBps < 0 ||
    slippageBps >= 10_000
  ) {
    throw new Error("Slippage must be between 0 and 9,999 basis points.");
  }
  if (quotedOutput < 0n) {
    throw new Error("Quoted output cannot be negative.");
  }

  return (
    (quotedOutput * BigInt(10_000 - slippageBps)) /
    BPS_DENOMINATOR
  );
}

export function encodeV4ExactInputSingle({
  pool,
  amountIn,
  amountOutMinimum,
}: {
  pool: V4PoolConfig;
  amountIn: bigint;
  amountOutMinimum: bigint;
}): EncodedV4Swap {
  if (amountIn <= 0n || amountIn > MAX_UINT128) {
    throw new Error("Swap input must fit in uint128 and be greater than zero.");
  }
  if (amountOutMinimum < 0n || amountOutMinimum > MAX_UINT128) {
    throw new Error("Minimum output must fit in uint128.");
  }

  const v4Planner = new V4Planner();
  v4Planner.addAction(Actions.SWAP_EXACT_IN_SINGLE, [
    {
      poolKey: pool.poolKey,
      zeroForOne: pool.zeroForOne,
      amountIn: amountIn.toString(),
      amountOutMinimum: amountOutMinimum.toString(),
      hookData: "0x",
    },
  ]);
  v4Planner.addAction(Actions.SETTLE_ALL, [
    pool.tokenIn,
    amountIn.toString(),
  ]);
  v4Planner.addAction(Actions.TAKE_ALL, [
    pool.tokenOut,
    amountOutMinimum.toString(),
  ]);

  const routePlanner = new RoutePlanner();
  routePlanner.addCommand(CommandType.V4_SWAP, [v4Planner.finalize()]);

  return {
    commands: routePlanner.commands as Hex,
    inputs: routePlanner.inputs as Hex[],
  };
}

export function assertPermit2Amount(amount: bigint): void {
  if (amount <= 0n || amount > MAX_UINT160) {
    throw new Error("Permit2 allowance must fit in uint160.");
  }
}

export function needsExactErc20Allowance(
  currentAllowance: bigint,
  requiredAmount: bigint
): boolean {
  return currentAllowance !== requiredAmount;
}

export function needsExactPermit2Allowance({
  currentAllowance,
  currentExpiration,
  requiredAmount,
  minimumExpiration,
}: {
  currentAllowance: bigint;
  currentExpiration: number;
  requiredAmount: bigint;
  minimumExpiration: number;
}): boolean {
  return (
    currentAllowance !== requiredAmount ||
    currentExpiration < minimumExpiration
  );
}

export function getPurchaseDisabledReason({
  isConnected,
  isSupportedChain,
  hasAmount,
  isQuoting,
  hasQuote,
  hasQuoteError,
  hasSufficientBalance,
  status,
}: PurchaseReadiness): string | null {
  if (!isConnected) return null;
  if (!isSupportedChain) return "Switch to Sepolia to purchase.";
  if (!hasAmount) return "Enter a purchase amount.";
  if (isQuoting) return "Waiting for quote.";
  if (hasQuoteError) return "Quote unavailable.";
  if (!hasQuote) return "Waiting for quote.";
  if (!hasSufficientBalance) return "Insufficient USDC balance.";
  if (
    status === "approving-erc20" ||
    status === "approving-permit2" ||
    status === "swapping"
  ) {
    return "Transaction in progress.";
  }
  return null;
}
