import { baseSepolia, base } from "viem/chains";

interface TokenInfo {
  address: string;
  name: string;
}

const FACTORY_ADDRESS: Record<number, `0x${string}`> = {
  [baseSepolia.id]:
    "0x5ccD30e539F24F34b870b8480d37e31f6D6F3ac7" as `0x${string}`,
  [base.id]: "0x5ccD30e539F24F34b870b8480d37e31f6D6F3ac7" as `0x${string}`,
};

const TEST_556_TOKEN_ADDRESS: Record<number, TokenInfo> = {
  [baseSepolia.id]: {
    address: "0x5ccD30e539F24F34b870b8480d37e31f6D6F3ac7" as `0x${string}`,
    name: "TEST 556 Token",
  },
  [base.id]: {
    address: "0x5ccD30e539F24F34b870b8480d37e31f6D6F3ac7" as `0x${string}`,
    name: "5.56×45mm NATO",
  },
};

const TOKEN_ADDRESSES: Record<number, TokenInfo[]> = {
  [baseSepolia.id]: [TEST_556_TOKEN_ADDRESS[baseSepolia.id]],
  [base.id]: [TEST_556_TOKEN_ADDRESS[base.id]],
};

export { TOKEN_ADDRESSES, TEST_556_TOKEN_ADDRESS, FACTORY_ADDRESS };
