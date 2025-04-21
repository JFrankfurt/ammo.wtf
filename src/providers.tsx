import { RainbowKitProvider, midnightTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { config } from "./wagmi";

const queryClient = new QueryClient();

export function Providers(props: { children: ReactNode }) {
  return (
    <>
      {/* @ts-ignore */}
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={midnightTheme({
              accentColor: "#00FF00",
              accentColorForeground: "#0D0D0D",
              borderRadius: "none",
              fontStack: "system",
              overlayBlur: "none",
            })}
          >
            {props.children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </>
  );
}
