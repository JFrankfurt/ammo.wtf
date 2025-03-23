import { base, sepolia } from "viem/chains";

export function isSupportedNetwork(chainId: number) {
  return chainId === base.id || chainId === sepolia.id;
}
