"use client";

import {
  Address,
  Avatar,
  EthBalance,
  Identity,
  Name,
} from "@coinbase/onchainkit/identity";
import { color } from "@coinbase/onchainkit/theme";
import { useAccount } from "wagmi";
import { base } from "wagmi/chains";

export function ConnectedAccountInfo() {
  const { address } = useAccount();
  if (!address) return null;
  return (
    <div className="absolute top-4 right-4">
      <Identity
        address={address}
        chain={base}
        className="rounded-lg px-4 pt-3 pb-2"
      >
        <Avatar />
        <Name />
        <EthBalance />
      </Identity>
    </div>
  );
}
