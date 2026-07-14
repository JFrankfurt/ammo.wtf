import {
  RESTRICTED_STATE_CODES,
  SHIPPING_STATE_CODES,
  shippingSchema,
} from "./shipping-validation";

function shippingInput(state: string) {
  return {
    recipient: {
      name: "Test Recipient",
      email: "TEST@EXAMPLE.COM",
    },
    address: {
      street1: "1 Test Way",
      city: "Denver",
      state,
      postalCode: "80202",
      country: "US",
    },
    preferences: {
      requireSignature: true,
      insurance: false,
      specialInstructions: "",
    },
    metadata: {
      version: "1.0",
      origin: "test",
    },
  };
}

describe("shipping validation", () => {
  it.each(RESTRICTED_STATE_CODES)("rejects restricted state %s", (state) => {
    expect(shippingSchema.safeParse(shippingInput(state)).success).toBe(false);
    expect(SHIPPING_STATE_CODES).not.toContain(state);
  });

  it("accepts and normalizes an eligible state", () => {
    const result = shippingSchema.parse(shippingInput(" co "));
    expect(result.address.state).toBe("CO");
    expect(result.recipient.email).toBe("test@example.com");
  });
});
