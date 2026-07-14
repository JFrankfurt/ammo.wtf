import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { AMMO_PRODUCT_METADATA, type TokenInfo } from "@/addresses";
import {
  ShippingFormAddress,
  type FormDataWithRequiredFields,
} from "@/components/ShippingFormAddress";
import { ShippingFormContents } from "@/components/ShippingFormContents";
import { TransactionStatus } from "@/components/TransactionStatus";

const token: TokenInfo = {
  address: "0x1000000000000000000000000000000000000001",
  name: "Test Ammunition",
  symbol: "TEST",
  product: AMMO_PRODUCT_METADATA,
};

function AddressHarness() {
  const {
    register,
    formState: { errors },
  } = useForm<FormDataWithRequiredFields>();
  return (
    <ShippingFormAddress
      register={register}
      errors={errors}
      isSubmitting={false}
      onBack={vi.fn()}
    />
  );
}

describe("shipping flow components", () => {
  it("omits restricted states from the address form", () => {
    render(<AddressHarness />);
    const stateSelect = screen.getByLabelText("State");

    expect(stateSelect).toContainElement(
      screen.getByRole("option", { name: "CO" })
    );
    expect(
      screen.queryByRole("option", { name: "CA" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "NY" })
    ).not.toBeInTheDocument();
  });

  it("surfaces unavailable batch deployment and disables continuation", () => {
    render(
      <ShippingFormContents
        selectedTokens={[token]}
        quantities={{ [token.address]: 1 }}
        handleQuantityChange={vi.fn()}
        totalRounds={250}
        totalValueUsd={75}
        hasSelectedQuantities
        onContinue={vi.fn()}
        balancesLoading={false}
        tokenBalances={{ [token.address]: 250 }}
        disabledReason="Shipping is unavailable until the batch redeemer is deployed."
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "batch redeemer is deployed"
    );
    expect(
      screen.getByRole("button", { name: "Continue to Shipping" })
    ).toBeDisabled();
  });

  it.each([
    ["pending", "Encrypting shipping details"],
    ["pending", "Reading token permit data"],
    ["pending", "Submitting one batch redemption"],
    ["pending", "Waiting for transaction confirmation"],
    ["success", "Shipping redemption confirmed"],
  ] as const)("renders %s receipt flow state", (status, message) => {
    render(
      <TransactionStatus
        status={status}
        message={message}
        error={null}
        hash={null}
        chainId={11155111}
      />
    );
    expect(screen.getByRole("status")).toHaveTextContent(message);
  });

  it("shows permit progress and sanitized rejection", () => {
    const { rerender } = render(
      <TransactionStatus
        status="pending"
        message="Signing exact permits: 1 of 2 complete…"
        error={null}
        hash={null}
      />
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "1 of 2 complete"
    );

    rerender(
      <TransactionStatus
        status="error"
        error={new Error("Permit signature request was cancelled.")}
        errorMessage="Permit signature request was cancelled."
        hash={null}
      />
    );
    expect(
      screen.getByText("Permit signature request was cancelled.")
    ).toBeVisible();
  });
});
