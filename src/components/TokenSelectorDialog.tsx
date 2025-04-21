import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment } from "react";
import { TokenInfo } from "../addresses";
import { TokenSelector } from "./TokenSelector";
import { Button } from "./Button";

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
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild as={Fragment}>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition duration-300 data-[closed]:opacity-0"
            aria-hidden="true"
          />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-3 md:p-4">
          <TransitionChild as={Fragment}>
            <DialogPanel className="w-full max-w-sm md:max-w-md transform overflow-hidden rounded-none bg-background border border-border p-4 md:p-6 transition-all duration-300 ease-out data-[closed]:opacity-0 data-[closed]:scale-95">
              <DialogTitle
                as="h3"
                className="text-lg font-mono font-bold text-accentGreen mb-4"
              >
                {mode === "ship"
                  ? "Select Ammo to Ship"
                  : "Select Ammo to Purchase"}
              </DialogTitle>

              <div className="mt-3 md:mt-4">
                <TokenSelector
                  onSelectToken={(token: TokenInfo) =>
                    onSelectToken(token, mode)
                  }
                  showBalancesOnly={mode === "ship"}
                />
              </div>

              <div className="mt-4 md:mt-6 flex justify-end pt-3 border-t border-border">
                <Button type="button" variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};
