import { createPublicClient, http, parseUnits } from "viem";
import { sepolia } from "viem/chains";
import { Token } from "@uniswap/sdk-core";
import { Pool } from "@uniswap/v4-sdk";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rpcUrl = process.env.SEPOLIA_RPC_URL;
if (!rpcUrl) {
  throw new Error("SEPOLIA_RPC_URL is required.");
}

const quoterSource = readFileSync(resolve(root, "src/abi/v4Quoter.ts"), "utf8");
const quoterMatch = quoterSource.match(/export default (\[[\s\S]+\]) as const;/);
if (!quoterMatch) {
  throw new Error("Unable to parse v4Quoter ABI.");
}
const quoterAbi = new Function(`return ${quoterMatch[1]}`)();

const tokens = [
  { symbol: "B556BMB77", address: "0x5ccD30e539F24F34b870b8480d37e31f6D6F3ac7" },
  { symbol: "P9HST2S", address: "0x8404176e3b00d1f2ccd07e9aad037cd8ca9e0ee7" },
  { symbol: "JELLO", address: "0x0d6cc84a4d6846b0e537d61051e12c7847a633a2" },
];

const usdc = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const quoter = "0x61B3f2011A92d183C7dbaDBdA940a7555Ccf9227";
const fee = 3000;
const tickSpacing = 60;
const hooks = "0x0000000000000000000000000000000000000000";
const totalAmount = parseUnits("11", 6);

const client = createPublicClient({ chain: sepolia, transport: http(rpcUrl) });

for (const token of tokens) {
  const [token0, token1] =
    BigInt(usdc) < BigInt(token.address)
      ? [usdc, token.address]
      : [token.address, usdc];
  const zeroForOne = usdc === token0;
  const currency0 = new Token(
    sepolia.id,
    token0,
    token0 === usdc ? 6 : 18
  );
  const currency1 = new Token(
    sepolia.id,
    token1,
    token1 === usdc ? 6 : 18
  );
  const poolKey = Pool.getPoolKey(currency0, currency1, fee, tickSpacing, hooks);
  const params = {
    poolKey,
    zeroForOne,
    exactAmount: totalAmount,
    hookData: "0x",
  };

  try {
    const quote = await client.readContract({
      address: quoter,
      abi: quoterAbi,
      functionName: "quoteExactInputSingle",
      args: [params],
    });
    console.log(`${token.symbol}: quote_ok amountOut=${quote[0]}`);
  } catch (error) {
    const message = error instanceof Error ? error.message.split("\n")[0] : String(error);
    console.log(`${token.symbol}: quote_failed ${message}`);
  }
}
