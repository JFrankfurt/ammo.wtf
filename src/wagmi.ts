import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { base, sepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "ammo.wtf",
  projectId: "90d5103a33c09cd272b535dbfffa8fe2",
  chains: [base, sepolia],
  transports: {
    [base.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
