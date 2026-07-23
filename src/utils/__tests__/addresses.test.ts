import { base, mainnet, sepolia } from "viem/chains";
import {
  BASE_CONFIG,
  getChainConfig,
  getTokensForChain,
  requireChainConfig,
  requireChainContract,
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

  it("returns the Base configuration with app contracts undeployed", () => {
    expect(getChainConfig(base.id)).toBe(BASE_CONFIG);
    expect(getTokensForChain(base.id)).toHaveLength(0);
    expect(BASE_CONFIG.contracts.ammoFactory).toBeUndefined();
    expect(BASE_CONFIG.contracts.ammoBatchRedeemer).toBeUndefined();
    // Native Base USDC, not a bridged or test token.
    expect(BASE_CONFIG.contracts.usdc).toBe(
      "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
    );
  });

  it("throws when a required contract is missing on the chain", () => {
    expect(() =>
      requireChainContract(base.id, "ammoFactory", "Admin token creation")
    ).toThrow(/not deployed on Base/);
    expect(requireChainContract(sepolia.id, "ammoFactory")).toBe(
      SEPOLIA_CONFIG.contracts.ammoFactory
    );
  });

  it("rejects unsupported chains", () => {
    expect(getChainConfig(mainnet.id)).toBeUndefined();
    expect(() => requireChainConfig(mainnet.id, "Purchase")).toThrow(
      UnsupportedChainError
    );
  });
});
