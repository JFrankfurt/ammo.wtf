import { CHAIN_TO_ADDRESSES_MAP } from "@uniswap/sdk-core";
import type { Address } from "viem";
import { sepolia } from "viem/chains";

export const ADDRESS_ZERO: Address =
  "0x0000000000000000000000000000000000000000";
export const SUPPORTED_CHAIN_ID = sepolia.id;
export type SupportedChainId = typeof SUPPORTED_CHAIN_ID;

export const AMMO_PRODUCT_METADATA = {
  roundsPerUnit: 250,
  decimals: 18,
  estimatedValueUsdPerRound: 0.3,
} as const;

export interface TokenInfo {
  address: Address;
  name: string;
  symbol: string;
  product: typeof AMMO_PRODUCT_METADATA;
  category?: string;
  caliber?: string;
  imageUrl?: string;
  description?: string;
  weight?: number;
  manufacturer?: string;
  icon?: string;
}

export interface AppChainConfig {
  chainId: SupportedChainId;
  explorerUrl: string;
  contracts: {
    ammoFactory: Address;
    ammoBatchRedeemer?: Address;
    permit2: Address;
    poolManager: Address;
    stateView: Address;
    universalRouter: Address;
    usdc: Address;
    v4Quoter: Address;
  };
  decimals: {
    ammoToken: 18;
    usdc: 6;
  };
  pool: {
    fee: 3000;
    hooks: Address;
    tickSpacing: 60;
  };
  tokens: readonly TokenInfo[];
}

const SEPOLIA_TOKENS = [
  {
    address: "0x5ccD30e539F24F34b870b8480d37e31f6D6F3ac7",
    name: "5.56 77GR Bone Frog Ammunition™ Barnes Match Burner OTM BT",
    symbol: "B556BMB77",
    product: AMMO_PRODUCT_METADATA,
    category: "rifle",
    caliber: "5.56mm",
    description: "77GR Barnes Match Burner OTM BT rifle ammunition",
    weight: 77,
    manufacturer: "Bone Frog Ammunition",
  },
  {
    address: "0x8404176e3b00d1f2ccd07e9aad037cd8ca9e0ee7",
    name: "Federal Personal Defense HST 9mm Luger 147 Grain",
    symbol: "P9HST2S",
    product: AMMO_PRODUCT_METADATA,
    category: "pistol",
    caliber: "9mm",
    description: "Personal Defense HST 9mm Luger 147 Grain pistol ammunition",
    weight: 147,
    manufacturer: "Federal",
  },
  {
    address: "0x0d6cc84a4d6846b0e537d61051e12c7847a633a2",
    name: "Estevan's Jello Rounds",
    symbol: "JELLO",
    product: AMMO_PRODUCT_METADATA,
    category: "pistol",
    caliber: "9mm",
    description: "extra tasty",
    weight: 220,
  },
] as const satisfies readonly TokenInfo[];

export const SEPOLIA_CONFIG = {
  chainId: SUPPORTED_CHAIN_ID,
  explorerUrl: "https://sepolia.etherscan.io",
  contracts: {
    ammoFactory: "0x448e52b9871fa281816af0b8b122cee52229ebaf",
    ammoBatchRedeemer: "0xFc97740aC762D681b1d09d598b69cC3D559DEb55",
    permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
    poolManager: CHAIN_TO_ADDRESSES_MAP[sepolia.id]
      .v4PoolManagerAddress as Address,
    stateView: CHAIN_TO_ADDRESSES_MAP[sepolia.id].v4StateView as Address,
    universalRouter: "0x3A9D48AB9751398BbFa63ad67599Bb04e4BdF98b",
    usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    v4Quoter: "0x61B3f2011A92d183C7dbaDBdA940a7555Ccf9227",
  },
  decimals: {
    ammoToken: AMMO_PRODUCT_METADATA.decimals,
    usdc: 6,
  },
  pool: {
    fee: 3000,
    hooks: ADDRESS_ZERO,
    tickSpacing: 60,
  },
  tokens: SEPOLIA_TOKENS,
} as const satisfies AppChainConfig;

export class UnsupportedChainError extends Error {
  constructor(chainId: number | undefined, operation = "This operation") {
    super(
      `${operation} supports Sepolia only. Connected chain: ${
        chainId ?? "none"
      }.`
    );
    this.name = "UnsupportedChainError";
  }
}

export function isSupportedChainId(
  chainId: number | undefined
): chainId is SupportedChainId {
  return chainId === SUPPORTED_CHAIN_ID;
}

export function assertSupportedChainId(
  chainId: number | undefined,
  operation?: string
): asserts chainId is SupportedChainId {
  if (!isSupportedChainId(chainId)) {
    throw new UnsupportedChainError(chainId, operation);
  }
}

export function getChainConfig(
  chainId: number | undefined
): AppChainConfig | undefined {
  return isSupportedChainId(chainId) ? SEPOLIA_CONFIG : undefined;
}

export function requireChainConfig(
  chainId: number | undefined,
  operation?: string
): AppChainConfig {
  assertSupportedChainId(chainId, operation);
  return SEPOLIA_CONFIG;
}

export function getTokensForChain(chainId: number | undefined): TokenInfo[] {
  return getChainConfig(chainId)?.tokens.slice() ?? [];
}
