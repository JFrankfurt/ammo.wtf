"use client";

import {
  Avatar,
  EthBalance,
  Identity,
  Name,
} from "@coinbase/onchainkit/identity";
import { Button } from "@headlessui/react";
import { useAccount, useConnect, useConnectors, useDisconnect } from "wagmi";
import { base } from "wagmi/chains";

export function ConnectedAccountInfo() {
  const { disconnect } = useDisconnect();
  const { status, address } = useAccount();
  const { connect } = useConnect();
  const connectors = useConnectors();
  const connector = connectors[0];

  if (status === "disconnected") {
    return (
      <div className="fixed top-4 right-4">
        <Button
          className="w-full px-4 py-2 text-shiroWhite bg-hinokiWood hover:bg-kansoClay transition-colors duration-200"
          onClick={() => connect({ connector })}
        >
          Connect Wallet
        </Button>
      </div>
    );
  }

  if (status === "connecting" || status === "reconnecting") {
    return (
      <div className="fixed top-4 right-4 bg-gray-100 px-4 py-2">
        Connecting...
      </div>
    );
  }
  return (
    <div className="absolute top-4 right-4">
      <Identity address={address} chain={base} className="px-4 pt-3 pb-2">
        <Avatar />
        <Name />
        <EthBalance />
      </Identity>
      <div className="text-right">
        <Button
          className="text-sm font-light text-akaneRed hover:text-red-700 italic hover:underline"
          onClick={() => disconnect()}
        >
          Disconnect
        </Button>
      </div>
    </div>
  );
}
