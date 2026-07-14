import {
  parseSignature,
  type Address,
  type Hex,
  type TypedDataDomain,
} from "viem";
import type { TokenInfo } from "@/addresses";
import type { ShippingData } from "@/data/shipping-validation";

export const PERMIT_LIFETIME_SECONDS = 30 * 60;
export const MAX_REDEMPTION_ITEMS = 20;

export interface CanonicalLineItem {
  token: Address;
  symbol: string;
  units: number;
  rounds: number;
  decimals: number;
  baseAmount: bigint;
}

export interface SerializedLineItem
  extends Omit<CanonicalLineItem, "baseAmount"> {
  baseAmount: string;
}

export interface ShippingPayload {
  shipping: ShippingData;
  lineItems: SerializedLineItem[];
}

export interface PermitTypedData {
  domain: TypedDataDomain;
  types: typeof PERMIT_TYPES;
  primaryType: "Permit";
  message: {
    owner: Address;
    spender: Address;
    value: bigint;
    nonce: bigint;
    deadline: bigint;
  };
}

const PERMIT_TYPES = {
  Permit: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

function compareAddresses(left: Address, right: Address): number {
  const normalizedLeft = left.toLowerCase();
  const normalizedRight = right.toLowerCase();
  return normalizedLeft < normalizedRight
    ? -1
    : normalizedLeft > normalizedRight
      ? 1
      : 0;
}

export function buildCanonicalLineItems(
  tokens: readonly TokenInfo[],
  quantities: Readonly<Record<string, number>>
): CanonicalLineItem[] {
  const tokensByAddress = new Map(
    tokens.map((token) => [token.address.toLowerCase(), token])
  );

  const lineItems = Object.entries(quantities)
    .filter(([, units]) => units > 0)
    .map(([address, units]) => {
      const token = tokensByAddress.get(address.toLowerCase());
      if (!token) {
        throw new Error(`Unknown ammunition token: ${address}.`);
      }
      if (!Number.isSafeInteger(units) || units <= 0) {
        throw new Error("Shipping units must be positive whole numbers.");
      }

      const rounds = units * token.product.roundsPerUnit;
      if (!Number.isSafeInteger(rounds)) {
        throw new Error("Selected round quantity is too large.");
      }

      return {
        token: token.address,
        symbol: token.symbol,
        units,
        rounds,
        decimals: token.product.decimals,
        baseAmount:
          BigInt(rounds) * 10n ** BigInt(token.product.decimals),
      };
    })
    .sort((left, right) => compareAddresses(left.token, right.token));

  if (lineItems.length === 0) {
    throw new Error("Select at least one ammunition product.");
  }
  if (lineItems.length > MAX_REDEMPTION_ITEMS) {
    throw new Error(
      `A redemption can contain at most ${MAX_REDEMPTION_ITEMS} products.`
    );
  }

  return lineItems;
}

export function serializeLineItems(
  lineItems: readonly CanonicalLineItem[]
): SerializedLineItem[] {
  return lineItems.map((item) => ({
    ...item,
    baseAmount: item.baseAmount.toString(),
  }));
}

export function buildShippingPayload(
  shipping: ShippingData,
  lineItems: readonly CanonicalLineItem[]
): ShippingPayload {
  return {
    shipping,
    lineItems: serializeLineItems(lineItems),
  };
}

export function createPermitDeadline(nowSeconds: number): bigint {
  if (!Number.isSafeInteger(nowSeconds) || nowSeconds < 0) {
    throw new Error("Current time must be a positive whole number.");
  }
  return BigInt(nowSeconds + PERMIT_LIFETIME_SECONDS);
}

export function createPermitTypedData({
  chainId,
  token,
  tokenName,
  owner,
  spender,
  value,
  nonce,
  deadline,
}: {
  chainId: number;
  token: Address;
  tokenName: string;
  owner: Address;
  spender: Address;
  value: bigint;
  nonce: bigint;
  deadline: bigint;
}): PermitTypedData {
  return {
    domain: {
      name: tokenName,
      version: "1",
      chainId,
      verifyingContract: token,
    },
    types: PERMIT_TYPES,
    primaryType: "Permit",
    message: {
      owner,
      spender,
      value,
      nonce,
      deadline,
    },
  };
}

export function splitPermitSignature(signature: Hex): {
  v: number;
  r: Hex;
  s: Hex;
} {
  const parsed = parseSignature(signature);
  const v =
    parsed.v === undefined
      ? Number(parsed.yParity) + 27
      : Number(parsed.v < 27n ? parsed.v + 27n : parsed.v);

  if (v !== 27 && v !== 28) {
    throw new Error("Permit signature has an invalid recovery value.");
  }

  return { v, r: parsed.r, s: parsed.s };
}
