"use client";
import { Button, Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
// mint new kinds of tokens
// mint additional inventory of existing tokens
// set new fee recipient

import { useState } from "react";
import { useAccount } from "wagmi";
import { MintNewTokenType } from "./admin/MintNewTokenType";
import { MintAdditionalInventory } from "./admin/MintAdditionalInventory";
import { SetFeeRecipient } from "./admin/SetFeeRecipient";

type AdminView = "main" | "mintNew" | "mintMore" | "setFee";

const ADMIN_ACCOUNTS = [
  "0x087A59EF79152a3143b6a4e87DC8B46e84D900B7",
  "0x48c89d77ae34ae475e4523b25ab01e363dce5a78",
];

export default function AdminPanel() {
  const { address } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<AdminView>("main");

  const handleClose = () => {
    setIsOpen(false);
    setCurrentView("main");
  };

  const renderContent = () => {
    switch (currentView) {
      case "mintNew":
        return <MintNewTokenType onBack={() => setCurrentView("main")} />;
      case "mintMore":
        return (
          <MintAdditionalInventory onBack={() => setCurrentView("main")} />
        );
      case "setFee":
        return <SetFeeRecipient onBack={() => setCurrentView("main")} />;
      default:
        return (
          <div className="space-y-form-gap">
            <DialogTitle className="text-2xl font-medium text-sumiBlack mb-6">
              Admin Panel
            </DialogTitle>
            <div className="flex flex-col gap-4">
              <Button
                className="w-full px-6 py-3 bg-hinokiWood text-shiroWhite rounded-form 
                           hover:bg-kansoClay transition-form duration-form"
                onClick={() => setCurrentView("mintNew")}
              >
                Mint New Token Type
              </Button>
              <Button
                className="w-full px-6 py-3 bg-hinokiWood text-shiroWhite rounded-form 
                           hover:bg-kansoClay transition-form duration-form"
                onClick={() => setCurrentView("mintMore")}
              >
                Mint Additional Inventory
              </Button>
              <Button
                className="w-full px-6 py-3 bg-hinokiWood text-shiroWhite rounded-form 
                           hover:bg-kansoClay transition-form duration-form"
                onClick={() => setCurrentView("setFee")}
              >
                Set Fee Recipient
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/20" aria-hidden="true" />
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="w-full max-w-lg space-y-form-gap bg-shiroWhite p-8 rounded-form shadow-form">
            {renderContent()}
          </DialogPanel>
        </div>
      </Dialog>

      {ADMIN_ACCOUNTS.includes(
        ((address as `0x${string}`) || "").toLowerCase()
      ) && (
        <Button
          className="fixed bottom-4 right-4 bg-black text-shiroWhite px-6 py-3"
          onClick={() => setIsOpen(!isOpen)}
        >
          Admin Panel
        </Button>
      )}
    </>
  );
}
