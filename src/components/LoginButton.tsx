"use client";
import AppProviders from "@/app/AppProviders";
import { Address, Avatar, Identity, Name } from "@coinbase/onchainkit/identity";
import { color } from "@coinbase/onchainkit/theme";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";

function RedirectIfSignedIn({ path }: { path: string }) {
  const account = useAccount();
  const router = useRouter();
  if (account.isConnected) {
    router.push(path);
  }
  return null;
}

export const LoginButton = () => {
  return (
    <AppProviders>
      <RedirectIfSignedIn path="/dashboard" />
      <Wallet>
        <ConnectWallet>
          <Avatar className="h-6 w-6" />
          <Name />
        </ConnectWallet>
      </Wallet>
    </AppProviders>
  );
};

export default LoginButton;
