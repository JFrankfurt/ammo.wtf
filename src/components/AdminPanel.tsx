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
import { cn } from "@/utils/cn";

type AdminView = "main" | "mintNew" | "mintMore" | "setFee";

const ADMIN_ACCOUNTS = [
  "0x087A59EF79152a3143b6a4e87DC8B46e84D900B7".toLowerCase(),
  "0x48c89d77ae34ae475e4523b25ab01e363dce5a78".toLowerCase(),
];

export default function AdminPanel() {
  const { address } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<AdminView>("main");

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => setCurrentView("main"), 300);
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
            <DialogTitle className="text-lg md:text-xl font-bold text-accentGreen">
              Admin Panel
            </DialogTitle>
            <div className="flex flex-col gap-3">
              <Button fullWidth onClick={() => setCurrentView("mintNew")}>
                Mint New Token Type
              </Button>
              <Button fullWidth onClick={() => setCurrentView("mintMore")}>
                Mint Additional Inventory
              </Button>
              <Button fullWidth onClick={() => setCurrentView("setFee")}>
                Set Fee Details
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={handleClose}
                className="mt-2"
              >
                Close
              </Button>
            </div>
          </div>
        );
    }
  };

  const isAdmin = ADMIN_ACCOUNTS.includes(
    (address?.toLowerCase() as `0x${string}`) || ""
  );

  return (
    <>
      <Transition show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleClose}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              aria-hidden="true"
            />
          </TransitionChild>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel
                className={cn(
                  "w-full max-w-md transform overflow-hidden",
                  "rounded-md",
                  "bg-background",
                  "p-4 md:p-6",
                  "border border-border"
                )}
              >
                {renderContent()}
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>

      {isAdmin && (
        <Button
          variant="primary"
          className="fixed top-4 left-4 lg:bottom-4 lg:right-4 z-40"
          onClick={() => setIsOpen(true)}
        >
          Admin
        </Button>
      )}
    </>
  );
}
