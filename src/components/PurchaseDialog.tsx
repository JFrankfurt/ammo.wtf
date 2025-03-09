import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
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
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-3 md:p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-sm md:max-w-md transform overflow-hidden rounded-xl md:rounded-2xl bg-white p-4 md:p-6 shadow-xl transition-all">
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
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};
