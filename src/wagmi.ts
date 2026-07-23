import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { base, sepolia } from "wagmi/chains";

// Optional dedicated Base RPC (e.g. Alchemy/Infura). Falls back to the public
// RPC when unset. Set VITE_BASE_RPC_URL in .env.local; never commit the URL.
const baseRpcUrl = import.meta.env.VITE_BASE_RPC_URL as string | undefined;

export const config = getDefaultConfig({
  appName: "ammo.wtf",
  projectId: "90d5103a33c09cd272b535dbfffa8fe2",
  // Sepolia first so it stays the default chain until Base contracts launch.
  chains: [sepolia, base],
  transports: {
    // @ts-ignore viem is duplicated by the current wagmi dependency tree.
    [sepolia.id]: http(),
    // @ts-ignore viem is duplicated by the current wagmi dependency tree.
    [base.id]: http(baseRpcUrl || undefined),
  },
  ssr: false,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
