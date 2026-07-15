import { base, sepolia } from "viem/chains";
import {
  getChainConfig,
  getTokensForChain,
  requireChainConfig,
  SEPOLIA_CONFIG,
  UnsupportedChainError,
} from "@/addresses";

describe("chain configuration", () => {
  it("returns the typed Sepolia configuration", () => {
    expect(getChainConfig(sepolia.id)).toBe(SEPOLIA_CONFIG);
    expect(getTokensForChain(sepolia.id)).toHaveLength(2);
  });

  it("wires the deployed Sepolia batch redeemer address", () => {
    expect(SEPOLIA_CONFIG.contracts.ammoBatchRedeemer).toBe(
      "0xFc97740aC762D681b1d09d598b69cC3D559DEb55"
    );
  });

  it("rejects Base instead of returning placeholder addresses", () => {
    expect(getChainConfig(base.id)).toBeUndefined();
    expect(() => requireChainConfig(base.id, "Purchase")).toThrow(
      UnsupportedChainError
    );
  });
});
