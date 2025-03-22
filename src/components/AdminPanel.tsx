"use client";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment, useState } from "react";
import { useAccount } from "wagmi";
import { MintAdditionalInventory } from "./admin/MintAdditionalInventory";
import { MintNewTokenType } from "./admin/MintNewTokenType";
import { SetFeeDetails } from "./admin/SetFeeDetails";
import { Button } from "./Button";

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
        return <SetFeeDetails onBack={() => setCurrentView("main")} />;
      default:
        return (
          <div className="space-y-4">
            <DialogTitle className="text-xl md:text-2xl font-medium text-sumiBlack">
              Admin Panel
            </DialogTitle>
            <div className="flex flex-col gap-3">
              <Button
                variant="primary"
                fullWidth
                onClick={() => setCurrentView("mintNew")}
              >
                Mint New Token Type
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={() => setCurrentView("mintMore")}
              >
                Mint Additional Inventory
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={() => setCurrentView("setFee")}
              >
                Set Fee Details
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <Transition show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleClose}>
          <TransitionChild as={Fragment}>
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition duration-300 data-[closed]:opacity-0"
              aria-hidden="true"
            />
          </TransitionChild>

          <div className="fixed inset-0 flex items-center justify-center p-3 md:p-4">
            <TransitionChild as={Fragment}>
              <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-xl md:rounded-2xl bg-shiroWhite p-4 md:p-6 shadow-xl transition-all duration-300 ease-out data-[closed]:opacity-0 data-[closed]:scale-95">
                {renderContent()}
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>

      {ADMIN_ACCOUNTS.includes(
        ((address as `0x${string}`) || "").toLowerCase()
      ) && (
        <Button
          variant="primary"
          className="py-1 px-2 sm:py-2 sm:px-4 fixed top-4 left-4 sm:bottom-4 sm:right-4 shadow-lg rounded-full"
          onClick={() => setIsOpen(!isOpen)}
        >
          Admin Panel
        </Button>
      )}
    </>
  );
}
