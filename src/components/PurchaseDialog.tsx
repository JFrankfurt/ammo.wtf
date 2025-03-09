import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment } from "react";
import { UniswapSwap } from "./PurchaseAmmoDialog";

interface PurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tokenAddress: string;
  tokenName?: string;
  tokenSymbol?: string;
  onSuccess: (txHash: string) => void;
  onError: (error: Error) => void;
}

export const PurchaseDialog = ({
  isOpen,
  onClose,
  tokenAddress,
  tokenName = "AmmoToken",
  tokenSymbol = "AMMO",
  onSuccess,
  onError,
}: PurchaseDialogProps) => {
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild as={Fragment}>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition duration-300 data-[closed]:opacity-0"
            aria-hidden="true"
          />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-3 md:p-4">
          <TransitionChild as={Fragment}>
            <DialogPanel className="w-full max-w-sm md:max-w-md transform overflow-hidden rounded-xl md:rounded-2xl bg-white p-4 md:p-6 shadow-xl transition-all duration-300 ease-out data-[closed]:opacity-0 data-[closed]:scale-95">
              <DialogTitle
                as="h3"
                className="text-base md:text-lg font-medium leading-6 text-gray-900"
              >
                Purchase {tokenName}
              </DialogTitle>

              <div className="mt-3 md:mt-4">
                <UniswapSwap
                  tokenAddress={tokenAddress}
                  tokenName={tokenName}
                  tokenSymbol={tokenSymbol}
                  onSuccess={onSuccess}
                  onError={onError}
                />
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};
