import { CHAIN_TO_ADDRESSES_MAP } from "@uniswap/sdk-core";
import { base, sepolia } from "viem/chains";

export const ADDRESS_ZERO =
  "0x0000000000000000000000000000000000000000" as `0x${string}`;
interface TokenInfo {
  address: `0x${string}`;
  name: string;
  symbol: string;
  category?: string;
  caliber?: string;
  imageUrl?: string;
  description?: string;
  weight?: number;
  manufacturer?: string;
  icon?: string;
}

const FACTORY_ADDRESS: Record<number, `0x${string}`> = {
  [base.id]: "" as `0x${string}`,
  [sepolia.id]: "0x448e52b9871fa281816af0b8b122cee52229ebaf" as `0x${string}`,
};

const TEST_556_TOKEN_ADDRESS: Record<number, TokenInfo> = {
  [sepolia.id]: {
    address: "0x5ccD30e539F24F34b870b8480d37e31f6D6F3ac7" as `0x${string}`,
    name: "5.56 77GR Bone Frog Ammunition™ Barnes Match Burner OTM BT",
    symbol: "B556BMB77",
    category: "rifle",
    caliber: "5.56mm",
    description: "77GR Barnes Match Burner OTM BT rifle ammunition",
    weight: 77,
    manufacturer: "Bone Frog Ammunition",
  },
};

const HST_9MM_TOKEN_ADDRESS: Record<number, TokenInfo> = {
  [sepolia.id]: {
    address: "0x8404176e3b00d1f2ccd07e9aad037cd8ca9e0ee7" as `0x${string}`,
    name: "Federal Personal Defense HST 9mm Luger 147 Grain",
    symbol: "P9HST2S",
    category: "pistol",
    caliber: "9mm",
    description: "Personal Defense HST 9mm Luger 147 Grain pistol ammunition",
    weight: 147,
    manufacturer: "Federal",
  },
};

const JELLO_ROUNDS_TOKEN_ADDRESS: Record<number, TokenInfo> = {
  [sepolia.id]: {
    address: "0x0d6cc84a4d6846b0e537d61051e12c7847a633a2" as `0x${string}`,
    name: "Estevan's Jello Rounds",
    symbol: "JELLO",
    category: "pistol",
    caliber: "9mm",
    description: "extra tasty",
    weight: 220,
  },
};

// Consolidated token registry - single source of truth for all tokens
const ALL_TOKENS = {
  TEST_556_TOKEN_ADDRESS,
  HST_9MM_TOKEN_ADDRESS,
  JELLO_ROUNDS_TOKEN_ADDRESS,
};

// Helper function to get all tokens for a specific chain
const getTokensForChain = (chainId: number): TokenInfo[] => {
  const tokensForChain = Object.values(ALL_TOKENS).map(
    (tokenRecord) => tokenRecord[chainId]
  );
  const filteredTokens = tokensForChain.filter((token) => token !== undefined);
  return filteredTokens.length > 0 ? filteredTokens : [];
};

// Legacy format for backward compatibility
const TOKEN_ADDRESSES: Record<number, TokenInfo[]> = {
  [base.id]: [],
  [sepolia.id]: [
    TEST_556_TOKEN_ADDRESS[sepolia.id],
    HST_9MM_TOKEN_ADDRESS[sepolia.id],
    JELLO_ROUNDS_TOKEN_ADDRESS[sepolia.id],
  ],
};

const USDC_ADDRESS: Record<number, `0x${string}`> = {
  [base.id]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`,
  [sepolia.id]: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as `0x${string}`,
};

// Define the Universal Router address
const UNIVERSAL_ROUTER_ADDRESSES: Record<number, `0x${string}`> = {
  [base.id]: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD' as `0x${string}`,
  [sepolia.id]: '0x3A9D48AB9751398BbFa63ad67599Bb04e4BdF98b' as `0x${string}`,
};

// Define the Pool Manager address
const POOL_MANAGER_ADDRESS: Record<number, `0x${string}`> = {
  [base.id]: CHAIN_TO_ADDRESSES_MAP[base.id]
    .v4PoolManagerAddress as `0x${string}`,
  [sepolia.id]: CHAIN_TO_ADDRESSES_MAP[sepolia.id]
    .v4PoolManagerAddress as `0x${string}`,
};

export type { TokenInfo };

export {
  ALL_TOKENS,
  FACTORY_ADDRESS,
  getTokensForChain,
  HST_9MM_TOKEN_ADDRESS,
  JELLO_ROUNDS_TOKEN_ADDRESS,
  POOL_MANAGER_ADDRESS,
  TEST_556_TOKEN_ADDRESS,
  TOKEN_ADDRESSES,
  UNIVERSAL_ROUTER_ADDRESSES,
  USDC_ADDRESS,
};
