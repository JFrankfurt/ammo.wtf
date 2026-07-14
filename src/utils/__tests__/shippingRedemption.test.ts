import type { Hex } from "viem";
import {
  AMMO_PRODUCT_METADATA,
  SEPOLIA_CONFIG,
  type TokenInfo,
} from "@/addresses";
import {
  buildCanonicalLineItems,
  buildShippingPayload,
  createPermitDeadline,
  createPermitTypedData,
  splitPermitSignature,
} from "@/utils/shippingRedemption";
import type { ShippingData } from "@/data/shipping-validation";

const firstToken: TokenInfo = {
  address: "0xF000000000000000000000000000000000000001",
  name: "First",
  symbol: "FIRST",
  product: AMMO_PRODUCT_METADATA,
};
const secondToken: TokenInfo = {
  address: "0x1000000000000000000000000000000000000002",
  name: "Second",
  symbol: "SECOND",
  product: AMMO_PRODUCT_METADATA,
};
const shipping: ShippingData = {
  recipient: { name: "Test Recipient", email: "test@example.com" },
  address: {
    street1: "1 Test Way",
    city: "Denver",
    state: "CO",
    postalCode: "80202",
    country: "US",
  },
  preferences: {
    requireSignature: true,
    insurance: false,
  },
  metadata: { version: "1.0", origin: "test" },
};

describe("shipping redemption utilities", () => {
  it("derives exact amounts and sorts by token address", () => {
    const items = buildCanonicalLineItems(
      [firstToken, secondToken],
      {
        [firstToken.address]: 2,
        [secondToken.address]: 1,
      }
    );

    expect(items.map((item) => item.token)).toEqual([
      secondToken.address,
      firstToken.address,
    ]);
    expect(items[0]).toMatchObject({
      symbol: "SECOND",
      units: 1,
      rounds: 250,
      decimals: 18,
      baseAmount: 250_000_000_000_000_000_000n,
    });
    expect(items[1].baseAmount).toBe(500_000_000_000_000_000_000n);
  });

  it("rejects fractional, unknown, and empty selections", () => {
    expect(() =>
      buildCanonicalLineItems([firstToken], { [firstToken.address]: 1.5 })
    ).toThrow("positive whole numbers");
    expect(() =>
      buildCanonicalLineItems([firstToken], {
        "0x2000000000000000000000000000000000000002": 1,
      })
    ).toThrow("Unknown ammunition token");
    expect(() => buildCanonicalLineItems([firstToken], {})).toThrow(
      "Select at least one"
    );
  });

  it("serializes the same canonical line items into the payload", () => {
    const items = buildCanonicalLineItems([firstToken], {
      [firstToken.address]: 3,
    });
    const payload = buildShippingPayload(shipping, items);

    expect(payload.shipping).toBe(shipping);
    expect(payload.lineItems).toEqual([
      {
        token: firstToken.address,
        symbol: "FIRST",
        units: 3,
        rounds: 750,
        decimals: 18,
        baseAmount: "750000000000000000000",
      },
    ]);
  });

  it("builds a 30-minute exact ERC-2612 permit", () => {
    const deadline = createPermitDeadline(1_000);
    const typedData = createPermitTypedData({
      chainId: SEPOLIA_CONFIG.chainId,
      token: firstToken.address,
      tokenName: "On-chain First",
      owner: "0x3000000000000000000000000000000000000003",
      spender: "0x4000000000000000000000000000000000000004",
      value: 250n,
      nonce: 7n,
      deadline,
    });

    expect(deadline).toBe(2_800n);
    expect(typedData.domain).toMatchObject({
      name: "On-chain First",
      version: "1",
      chainId: SEPOLIA_CONFIG.chainId,
      verifyingContract: firstToken.address,
    });
    expect(typedData.message).toMatchObject({
      value: 250n,
      nonce: 7n,
      deadline: 2_800n,
    });
  });

  it("splits and normalizes a permit signature", () => {
    const signature =
      `0x${"11".repeat(32)}${"22".repeat(32)}1b` as Hex;

    expect(splitPermitSignature(signature)).toEqual({
      r: `0x${"11".repeat(32)}`,
      s: `0x${"22".repeat(32)}`,
      v: 27,
    });
  });
});
