interface TokenInfo {
  address: string;
  name: string;
}

const TEST_556_TOKEN_ADDRESS: TokenInfo = {
  address: "0x5ccD30e539F24F34b870b8480d37e31f6D6F3ac7",
  name: "TEST 556 Token"
};

const TOKEN_ADDRESSES: TokenInfo[] = [
  TEST_556_TOKEN_ADDRESS,
];

export { TOKEN_ADDRESSES, TEST_556_TOKEN_ADDRESS };
