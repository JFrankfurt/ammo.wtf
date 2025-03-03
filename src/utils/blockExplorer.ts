import { base, baseSepolia, sepolia } from "viem/chains";

export function getExplorerUrl(chainId?: number) {
  switch (chainId) {
    case baseSepolia.id:
      return "https://sepolia.basescan.org";
    case sepolia.id:
      return "https://sepolia.etherscan.io";
    case base.id:
    default:
      return "https://basescan.org";
  }
}
