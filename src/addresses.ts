import { CHAIN_TO_ADDRESSES_MAP } from "@uniswap/sdk-core";
import type { Address } from "viem";
import { base, sepolia } from "viem/chains";

export const ADDRESS_ZERO: Address =
  "0x0000000000000000000000000000000000000000";
// Permit2 is deployed at the same address on every chain.
const PERMIT2_ADDRESS: Address = "0x000000000022D473030F116dDEE9F6B43aC78BA3";

export const SUPPORTED_CHAIN_IDS = [sepolia.id, base.id] as const;
export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number];
// Fallback chain for disconnected or unsupported-chain contexts. Flip to
// base.id once the Base contracts and pools are live.
export const DEFAULT_CHAIN_ID: SupportedChainId = sepolia.id;

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
  chainName: string;
  explorerUrl: string;
  contracts: {
    ammoFactory?: Address;
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
] as const satisfies readonly TokenInfo[];

export const SEPOLIA_CONFIG = {
  chainId: sepolia.id,
  chainName: "Sepolia",
  explorerUrl: "https://sepolia.etherscan.io",
  contracts: {
    ammoFactory: "0x448e52b9871fa281816af0b8b122cee52229ebaf",
    ammoBatchRedeemer: "0xFc97740aC762D681b1d09d598b69cC3D559DEb55",
    permit2: PERMIT2_ADDRESS,
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

// TODO(base-launch): deploy the factory, tokens, and batch redeemer from
// ammo.wtf-contracts, seed the v4 pools, then fill in the addresses and token
// list below. Purchase and shipping stay disabled on Base until then.
const BASE_TOKENS = [] as const satisfies readonly TokenInfo[];

export const BASE_CONFIG = {
  chainId: base.id,
  chainName: "Base",
  explorerUrl: "https://basescan.org",
  contracts: {
    ammoFactory: undefined,
    ammoBatchRedeemer: undefined,
    permit2: PERMIT2_ADDRESS,
    poolManager: CHAIN_TO_ADDRESSES_MAP[base.id]
      .v4PoolManagerAddress as Address,
    stateView: CHAIN_TO_ADDRESSES_MAP[base.id].v4StateView as Address,
    universalRouter: "0x6fF5693b99212Da76ad316178A184AB56D299b43",
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    v4Quoter: CHAIN_TO_ADDRESSES_MAP[base.id].v4QuoterAddress as Address,
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
  tokens: BASE_TOKENS,
} as const satisfies AppChainConfig;

export const CHAIN_CONFIGS: Record<SupportedChainId, AppChainConfig> = {
  [sepolia.id]: SEPOLIA_CONFIG,
  [base.id]: BASE_CONFIG,
};

export const DEFAULT_CHAIN_CONFIG = CHAIN_CONFIGS[DEFAULT_CHAIN_ID];

const SUPPORTED_CHAIN_NAMES = SUPPORTED_CHAIN_IDS.map(
  (id) => CHAIN_CONFIGS[id].chainName
).join(" and ");

export class UnsupportedChainError extends Error {
  constructor(chainId: number | undefined, operation = "This operation") {
    super(
      `${operation} supports ${SUPPORTED_CHAIN_NAMES} only. Connected chain: ${
        chainId ?? "none"
      }.`
    );
    this.name = "UnsupportedChainError";
  }
}

export function isSupportedChainId(
  chainId: number | undefined
): chainId is SupportedChainId {
  return SUPPORTED_CHAIN_IDS.some((id) => id === chainId);
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
  return isSupportedChainId(chainId) ? CHAIN_CONFIGS[chainId] : undefined;
}

export function requireChainConfig(
  chainId: number | undefined,
  operation?: string
): AppChainConfig {
  assertSupportedChainId(chainId, operation);
  return CHAIN_CONFIGS[chainId];
}

export function requireChainContract(
  chainId: number | undefined,
  contract: keyof AppChainConfig["contracts"],
  operation?: string
): Address {
  const config = requireChainConfig(chainId, operation);
  const address = config.contracts[contract];
  if (!address) {
    throw new Error(
      `${operation ?? "This operation"} is unavailable: ${contract} is not deployed on ${config.chainName}.`
    );
  }
  return address;
}

export function getTokensForChain(chainId: number | undefined): TokenInfo[] {
  return getChainConfig(chainId)?.tokens.slice() ?? [];
}
