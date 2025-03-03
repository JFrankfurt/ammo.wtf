import { baseSepolia, base, sepolia } from "viem/chains";

interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
}

const FACTORY_ADDRESS: Record<number, `0x${string}`> = {
  [baseSepolia.id]:
    "0x5ccD30e539F24F34b870b8480d37e31f6D6F3ac7" as `0x${string}`,
  [base.id]: "" as `0x${string}`,
  [sepolia.id]: "0x448e52b9871fa281816af0b8b122cee52229ebaf" as `0x${string}`,
};

const TEST_556_TOKEN_ADDRESS: Record<number, TokenInfo> = {
  [baseSepolia.id]: {
    address: "0x5ccD30e539F24F34b870b8480d37e31f6D6F3ac7" as `0x${string}`,
    name: "TEST 556 Token",
    symbol: "TEST 5.56",
  },
  [base.id]: {
    address: "" as `0x${string}`,
    name: "5.56×45mm NATO",
    symbol: "5.56",
  },
  [sepolia.id]: {
    address: "0x5ccD30e539F24F34b870b8480d37e31f6D6F3ac7" as `0x${string}`,
    name: "5.56 77GR Bone Frog Ammunition™ Barnes Match Burner OTM BT",
    symbol: "B556BMB77",
  },
};

const TOKEN_ADDRESSES: Record<number, TokenInfo[]> = {
  [baseSepolia.id]: [TEST_556_TOKEN_ADDRESS[baseSepolia.id]],
  [base.id]: [TEST_556_TOKEN_ADDRESS[base.id]],
  [sepolia.id]: [TEST_556_TOKEN_ADDRESS[sepolia.id]],
};

const USDC_ADDRESS: Record<number, `0x${string}`> = {
  [baseSepolia.id]:
    "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as `0x${string}`,
  [base.id]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`,
  [sepolia.id]: "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238" as `0x${string}`,
};

export {
  TOKEN_ADDRESSES,
  TEST_556_TOKEN_ADDRESS,
  FACTORY_ADDRESS,
  USDC_ADDRESS,
};
