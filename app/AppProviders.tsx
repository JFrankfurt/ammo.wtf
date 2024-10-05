import { config } from "@/src/wagmi";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { Provider as TooltipProvider } from "@radix-ui/react-tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren } from "react";
import { WagmiProvider } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";

const isDevelopment = process.env.NODE_ENV === "development";

const queryClient = new QueryClient();

export default function AppProviders({ children }: PropsWithChildren<{}>) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          chain={isDevelopment ? baseSepolia : base}
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
        >
          <TooltipProvider>{children}</TooltipProvider>
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
