import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { base, sepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "ammo.wtf",
  projectId: "90d5103a33c09cd272b535dbfffa8fe2",
  chains: [sepolia, base],
  transports: {
    // @ts-ignore
    [sepolia.id]: http(),
    // @ts-ignore
    [base.id]: http(),
  },
  ssr: false,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
