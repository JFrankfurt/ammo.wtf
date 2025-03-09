import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
} from "@headlessui/react";
import { Fragment } from "react";
import { TokenInfo } from "../addresses";
import { TokenSelector } from "./TokenSelector";

interface TokenSelectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectToken: (token: TokenInfo, action: "ship" | "purchase") => void;
  mode: "ship" | "purchase";
}

export const TokenSelectorDialog = ({
  isOpen,
  onClose,
  onSelectToken,
  mode,
}: TokenSelectorDialogProps) => {
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
                {mode === "ship"
                  ? "Select Ammunition to Ship"
                  : "Select Ammunition to Purchase"}
              </DialogTitle>

              <div className="mt-3 md:mt-4">
                <TokenSelector
                  onSelectToken={(token: TokenInfo) =>
                    onSelectToken(token, mode)
                  }
                  showBalancesOnly={mode === "ship"}
                />
              </div>

              <div className="mt-4 md:mt-6 flex justify-end">
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
            </DialogPanel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};
