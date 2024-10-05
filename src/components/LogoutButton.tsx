"use client";
import AppProviders from "@/app/AppProviders";
import { Button } from "@headlessui/react";
import { useRouter } from "next/navigation";
import { useAccount, useDisconnect } from "wagmi";

function LogoutBtn() {
  const { disconnect } = useDisconnect();
  return <Button onClick={() => disconnect()}>logout</Button>;
}
function RedirectIfSignedOut({ path }: { path: string }) {
  const account = useAccount();
  const router = useRouter();
  if (!account.isConnected) {
    router.push(path);
  }
  return null;
}

export const LogoutButton = () => {
  return (
    <AppProviders>
      <RedirectIfSignedOut path="/" />
      <LogoutBtn />
    </AppProviders>
  );
};

export default LogoutButton;
