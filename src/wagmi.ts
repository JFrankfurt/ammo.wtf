import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";


export const config = getDefaultConfig({
  appName: 'My RainbowKit App',
  projectId: 'YOUR_PROJECT_ID',
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  ssr: true, // If your dApp uses server side rendering (SSR)
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
