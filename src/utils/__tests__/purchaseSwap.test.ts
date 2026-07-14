import { decodeAbiParameters } from "viem";
import { SEPOLIA_CONFIG } from "@/addresses";
import {
  calculateMinimumOutput,
  calculatePurchaseAmounts,
  deriveV4PoolConfig,
  encodeV4ExactInputSingle,
  getPurchaseDisabledReason,
  needsExactErc20Allowance,
  needsExactPermit2Allowance,
  type PurchaseReadiness,
} from "@/utils/purchaseSwap";

const outputToken = SEPOLIA_CONFIG.tokens[0].address;

function readiness(
  overrides: Partial<PurchaseReadiness> = {}
): PurchaseReadiness {
  return {
    isConnected: true,
    isSupportedChain: true,
    hasAmount: true,
    isQuoting: false,
    hasQuote: true,
    hasQuoteError: false,
    hasSufficientBalance: true,
    status: "ready",
    ...overrides,
  };
}

describe("purchase calculations", () => {
  it("uses subtotal plus exactly ten percent as swap input", () => {
    const amounts = calculatePurchaseAmounts("100.25");

    expect(amounts.subtotalAmount).toBe(100_250_000n);
    expect(amounts.feeAmount).toBe(10_025_000n);
    expect(amounts.totalAmount).toBe(110_275_000n);
    expect(amounts.total).toBe("110.275");
  });

  it("rejects invalid and negative amounts", () => {
    expect(() => calculatePurchaseAmounts("not-a-number")).toThrow();
    expect(() => calculatePurchaseAmounts("-1")).toThrow(
      "Purchase amount cannot be negative"
    );
  });

  it("calculates minimum output from basis-point slippage", () => {
    expect(calculateMinimumOutput(1_000_000n, 500)).toBe(950_000n);
    expect(calculateMinimumOutput(101n, 100)).toBe(99n);
    expect(() => calculateMinimumOutput(1n, 10_000)).toThrow();
  });
});

describe("V4 pool and command encoding", () => {
  it("sorts pool currencies and derives direction from input currency", () => {
    const usdcToAmmo = deriveV4PoolConfig({
      chainId: SEPOLIA_CONFIG.chainId,
      tokenIn: SEPOLIA_CONFIG.contracts.usdc,
      tokenOut: outputToken,
      tokenInDecimals: SEPOLIA_CONFIG.decimals.usdc,
      tokenOutDecimals: SEPOLIA_CONFIG.decimals.ammoToken,
      ...SEPOLIA_CONFIG.pool,
    });
    const ammoToUsdc = deriveV4PoolConfig({
      chainId: SEPOLIA_CONFIG.chainId,
      tokenIn: outputToken,
      tokenOut: SEPOLIA_CONFIG.contracts.usdc,
      tokenInDecimals: SEPOLIA_CONFIG.decimals.ammoToken,
      tokenOutDecimals: SEPOLIA_CONFIG.decimals.usdc,
      ...SEPOLIA_CONFIG.pool,
    });

    expect(
      BigInt(usdcToAmmo.poolKey.currency0) <
        BigInt(usdcToAmmo.poolKey.currency1)
    ).toBe(true);
    expect(usdcToAmmo.poolKey).toEqual(ammoToUsdc.poolKey);
    expect(usdcToAmmo.zeroForOne).not.toBe(ammoToUsdc.zeroForOne);
  });

  it("encodes official V4 exact-input action sequence and limits", () => {
    const pool = deriveV4PoolConfig({
      chainId: SEPOLIA_CONFIG.chainId,
      tokenIn: SEPOLIA_CONFIG.contracts.usdc,
      tokenOut: outputToken,
      tokenInDecimals: SEPOLIA_CONFIG.decimals.usdc,
      tokenOutDecimals: SEPOLIA_CONFIG.decimals.ammoToken,
      ...SEPOLIA_CONFIG.pool,
    });
    const encoded = encodeV4ExactInputSingle({
      pool,
      amountIn: 1_100_000n,
      amountOutMinimum: 95n,
    });

    expect(encoded.commands).toBe("0x10");
    expect(encoded.inputs).toHaveLength(1);
    const [actions, params] = decodeAbiParameters(
      [{ type: "bytes" }, { type: "bytes[]" }],
      encoded.inputs[0]
    );
    expect(actions).toBe("0x060c0f");
    expect(params).toHaveLength(3);

    const [swap] = decodeAbiParameters(
      [
        {
          type: "tuple",
          components: [
            {
              name: "poolKey",
              type: "tuple",
              components: [
                { name: "currency0", type: "address" },
                { name: "currency1", type: "address" },
                { name: "fee", type: "uint24" },
                { name: "tickSpacing", type: "int24" },
                { name: "hooks", type: "address" },
              ],
            },
            { name: "zeroForOne", type: "bool" },
            { name: "amountIn", type: "uint128" },
            { name: "amountOutMinimum", type: "uint128" },
            { name: "hookData", type: "bytes" },
          ],
        },
      ],
      params[0]
    );
    expect(swap.amountIn).toBe(1_100_000n);
    expect(swap.amountOutMinimum).toBe(95n);
  });
});

describe("purchase readiness", () => {
  it("keeps disconnected button enabled for wallet connection", () => {
    expect(
      getPurchaseDisabledReason(readiness({ isConnected: false }))
    ).toBeNull();
  });

  it.each([
    [{ isSupportedChain: false }, "Switch to Sepolia to purchase."],
    [{ hasAmount: false }, "Enter a purchase amount."],
    [{ isQuoting: true }, "Waiting for quote."],
    [{ hasQuoteError: true }, "Quote unavailable."],
    [{ hasQuote: false }, "Waiting for quote."],
    [{ hasSufficientBalance: false }, "Insufficient USDC balance."],
    [{ status: "approving-erc20" }, "Transaction in progress."],
    [{ status: "approving-permit2" }, "Transaction in progress."],
    [{ status: "swapping" }, "Transaction in progress."],
  ] as const)("disables for %o", (overrides, expected) => {
    expect(
      getPurchaseDisabledReason(readiness(overrides))
    ).toBe(expected);
  });
});

describe("exact authorization policy", () => {
  it("requires ERC20 approval unless allowance exactly matches input", () => {
    expect(needsExactErc20Allowance(11n, 11n)).toBe(false);
    expect(needsExactErc20Allowance(10n, 11n)).toBe(true);
    expect(needsExactErc20Allowance(12n, 11n)).toBe(true);
  });

  it("requires exact, sufficiently long Permit2 allowance", () => {
    expect(
      needsExactPermit2Allowance({
        currentAllowance: 11n,
        currentExpiration: 2_000,
        requiredAmount: 11n,
        minimumExpiration: 1_500,
      })
    ).toBe(false);
    expect(
      needsExactPermit2Allowance({
        currentAllowance: 12n,
        currentExpiration: 2_000,
        requiredAmount: 11n,
        minimumExpiration: 1_500,
      })
    ).toBe(true);
    expect(
      needsExactPermit2Allowance({
        currentAllowance: 11n,
        currentExpiration: 1_499,
        requiredAmount: 11n,
        minimumExpiration: 1_500,
      })
    ).toBe(true);
  });
});
