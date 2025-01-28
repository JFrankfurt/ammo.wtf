"use client";

import type { ReactNode } from "react";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { baseSepolia } from "wagmi/chains";
import { config } from "./wagmi";
import { WagmiProvider } from "wagmi";

export function Providers(props: { children: ReactNode }) {
  return (
    <OnchainKitProvider chain={baseSepolia}>
      <WagmiProvider config={config}>{props.children}</WagmiProvider>
    </OnchainKitProvider>
  );
}
