"use client";

import { Button } from "@headlessui/react";
import {
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import {
  useAccount,
  useConnect,
  useConnectors,
  useDisconnect,
  useReadContract,
} from "wagmi";
import erc20Abi from "../abi/erc20";
import { useState } from "react";

const TokenBalanceInfo = () => {
  const { data: balance } = useReadContract({
    address: "0x0000000000000000000000000000000000000000",
    abi: erc20Abi,
    functionName: "balanceOf",
    args: ["0xaddress"],
  });
  return (
    <>
      <h2 className="text-xl font-bold ">Balance</h2>
      <p className="text-lg">5.56: {balance || "none"}</p>
    </>
  );
};

const RedemptionForm = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="max-w-lg space-y-4 border bg-white p-12">
          <DialogTitle className="font-bold">Redemption Form</DialogTitle>
          <Description className="text-center text-xl">
            Enter the amount of tokens you want to redeem. The minimum
            redemption amount is 250 tokens.
          </Description>
          <input type="number" placeholder="Amount" />
          <Button className="w-full">Redeem</Button>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

const ConnectedAccountTokenInfo = () => {
  const { status, address } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const connectors = useConnectors();
  const connector = connectors[0];

  const [isRedemptionOpen, setIsRedemptionOpen] = useState(false);
  if (status === "disconnected") {
    return (
      <Button className="p-4" onClick={() => connect({ connector })}>
        Connect
      </Button>
    );
  }
  if (status === "connecting" || status === "reconnecting") {
    return <div className="p-4">Connecting...</div>;
  }
  if (status === "connected") {
    return (
      <div className="ml-4">
        <TokenBalanceInfo />
        <Button onClick={() => disconnect({ connector })}>Disconnect</Button>
        <RedemptionForm
          isOpen={isRedemptionOpen}
          onClose={() => setIsRedemptionOpen(false)}
        />
      </div>
    );
  }
  return null;
};

export default ConnectedAccountTokenInfo;
