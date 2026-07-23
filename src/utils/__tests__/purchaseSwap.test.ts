import { decodeAbiParameters } from "viem";
import { SEPOLIA_CONFIG } from "@/addresses";
import {
  buildPermit2TypedData,
  calculateMinimumOutput,
  calculatePurchaseAmounts,
  deriveV4PoolConfig,
  encodeV4ExactInputSingle,
  getPurchaseDisabledReason,
  needsErc20Allowance,
  needsPermit2Signature,
  type Permit2Single,
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

  it("prepends PERMIT2_PERMIT command when a signed permit is provided", () => {
    const pool = deriveV4PoolConfig({
      chainId: SEPOLIA_CONFIG.chainId,
      tokenIn: SEPOLIA_CONFIG.contracts.usdc,
      tokenOut: outputToken,
      tokenInDecimals: SEPOLIA_CONFIG.decimals.usdc,
      tokenOutDecimals: SEPOLIA_CONFIG.decimals.ammoToken,
      ...SEPOLIA_CONFIG.pool,
    });
    const permitSingle: Permit2Single = {
      details: {
        token: SEPOLIA_CONFIG.contracts.usdc,
        amount: 1_100_000n,
        expiration: 2_000,
        nonce: 7,
      },
      spender: SEPOLIA_CONFIG.contracts.universalRouter,
      sigDeadline: 1_500n,
    };
    const signature = `0x${"ab".repeat(65)}` as const;
    const encoded = encodeV4ExactInputSingle({
      pool,
      amountIn: 1_100_000n,
      amountOutMinimum: 95n,
      permit: { permitSingle, signature },
    });

    expect(encoded.commands).toBe("0x0a10");
    expect(encoded.inputs).toHaveLength(2);
    const [decodedPermit, decodedSignature] = decodeAbiParameters(
      [
        {
          type: "tuple",
          components: [
            {
              name: "details",
              type: "tuple",
              components: [
                { name: "token", type: "address" },
                { name: "amount", type: "uint160" },
                { name: "expiration", type: "uint48" },
                { name: "nonce", type: "uint48" },
              ],
            },
            { name: "spender", type: "address" },
            { name: "sigDeadline", type: "uint256" },
          ],
        },
        { type: "bytes" },
      ],
      encoded.inputs[0]
    );
    expect(decodedPermit.details.token.toLowerCase()).toBe(
      SEPOLIA_CONFIG.contracts.usdc.toLowerCase()
    );
    expect(decodedPermit.details.amount).toBe(1_100_000n);
    expect(decodedPermit.details.expiration).toBe(2_000);
    expect(decodedPermit.details.nonce).toBe(7);
    expect(decodedPermit.sigDeadline).toBe(1_500n);
    expect(decodedSignature).toBe(signature);
  });
});

describe("purchase readiness", () => {
  it("keeps disconnected button enabled for wallet connection", () => {
    expect(
      getPurchaseDisabledReason(readiness({ isConnected: false }))
    ).toBeNull();
  });

  it.each([
    [
      { isSupportedChain: false },
      "Switch to a supported network to purchase.",
    ],
    [{ hasAmount: false }, "Enter a purchase amount."],
    [{ isQuoting: true }, "Waiting for quote."],
    [{ hasQuoteError: true }, "Quote unavailable."],
    [{ hasQuote: false }, "Waiting for quote."],
    [{ hasSufficientBalance: false }, "Insufficient USDC balance."],
    [{ status: "approving-erc20" }, "Transaction in progress."],
    [{ status: "signing-permit" }, "Transaction in progress."],
    [{ status: "swapping" }, "Transaction in progress."],
  ] as const)("disables for %o", (overrides, expected) => {
    expect(
      getPurchaseDisabledReason(readiness(overrides))
    ).toBe(expected);
  });
});

describe("authorization policy", () => {
  it("requires ERC20 approval only when allowance is insufficient", () => {
    expect(needsErc20Allowance(11n, 11n)).toBe(false);
    expect(needsErc20Allowance(12n, 11n)).toBe(false);
    expect(needsErc20Allowance(10n, 11n)).toBe(true);
  });

  it("requires Permit2 signature when allowance is short or expiring", () => {
    expect(
      needsPermit2Signature({
        currentAllowance: 11n,
        currentExpiration: 2_000,
        requiredAmount: 11n,
        minimumExpiration: 1_500,
      })
    ).toBe(false);
    expect(
      needsPermit2Signature({
        currentAllowance: 12n,
        currentExpiration: 2_000,
        requiredAmount: 11n,
        minimumExpiration: 1_500,
      })
    ).toBe(false);
    expect(
      needsPermit2Signature({
        currentAllowance: 10n,
        currentExpiration: 2_000,
        requiredAmount: 11n,
        minimumExpiration: 1_500,
      })
    ).toBe(true);
    expect(
      needsPermit2Signature({
        currentAllowance: 11n,
        currentExpiration: 1_499,
        requiredAmount: 11n,
        minimumExpiration: 1_500,
      })
    ).toBe(true);
  });

  it("builds Permit2 typed data against the Permit2 domain", () => {
    const permit: Permit2Single = {
      details: {
        token: SEPOLIA_CONFIG.contracts.usdc,
        amount: 110n,
        expiration: 2_000,
        nonce: 3,
      },
      spender: SEPOLIA_CONFIG.contracts.universalRouter,
      sigDeadline: 1_500n,
    };
    const typedData = buildPermit2TypedData({
      chainId: SEPOLIA_CONFIG.chainId,
      permit2: SEPOLIA_CONFIG.contracts.permit2,
      permit,
    });

    expect(typedData.domain).toEqual({
      name: "Permit2",
      chainId: SEPOLIA_CONFIG.chainId,
      verifyingContract: SEPOLIA_CONFIG.contracts.permit2,
    });
    expect(typedData.primaryType).toBe("PermitSingle");
    expect(typedData.message).toBe(permit);
  });
});
