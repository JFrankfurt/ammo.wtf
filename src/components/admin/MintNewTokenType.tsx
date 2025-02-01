import { DialogTitle } from "@headlessui/react";
import { FormInput } from "@/src/components/FormInput";
import { Button } from "@headlessui/react";

export function MintNewTokenType({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-form-gap">
      <DialogTitle className="text-2xl font-medium text-sumiBlack mb-6">
        Mint New Token Type
      </DialogTitle>
      <FormInput
        label="Token Name"
        placeholder="Enter token name"
        id="tokenName"
      />
      <FormInput
        label="Token Symbol"
        placeholder="Enter token symbol"
        id="tokenSymbol"
      />
      <div className="flex justify-between pt-4">
        <Button
          className="px-6 py-3 bg-ashiStone text-shiroWhite rounded-form 
                     hover:bg-kuroganeSteel transition-form duration-form"
          onClick={onBack}
        >
          Back
        </Button>
        <Button
          className="px-6 py-3 bg-hinokiWood text-shiroWhite rounded-form 
                     hover:bg-kansoClay transition-form duration-form"
        >
          Mint Token
        </Button>
      </div>
    </div>
  );
}
