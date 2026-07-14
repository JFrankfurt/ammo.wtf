import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { sepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "ammo.wtf",
  projectId: "90d5103a33c09cd272b535dbfffa8fe2",
  chains: [sepolia],
  transports: {
    // @ts-ignore viem is duplicated by the current wagmi dependency tree.
    [sepolia.id]: http(),
  },
  ssr: false,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
