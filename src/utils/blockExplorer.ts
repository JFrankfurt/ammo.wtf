import { base, sepolia } from "viem/chains";

export function getExplorerUrl(chainId?: number) {
  switch (chainId) {
    case sepolia.id:
      return "https://sepolia.etherscan.io";
    case base.id:
    default:
      return "https://basescan.org";
  }
}
