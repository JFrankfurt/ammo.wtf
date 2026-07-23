import { fireEvent, render, screen } from "@testing-library/react";
import { PurchaseDialog } from "@/components/PurchaseDialog";
import { SEPOLIA_CONFIG } from "@/addresses";

const mocks = vi.hoisted(() => ({
  useAccount: vi.fn(),
  openConnectModal: vi.fn(),
  usePurchase: vi.fn(),
}));

vi.mock("wagmi", () => ({
  useAccount: mocks.useAccount,
}));

vi.mock("@rainbow-me/rainbowkit", () => ({
  useConnectModal: () => ({ openConnectModal: mocks.openConnectModal }),
}));

vi.mock("@/hooks/usePurchase", () => ({
  usePurchase: mocks.usePurchase,
}));

function purchaseState(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    amounts: {
      subtotalAmount: 10_000_000n,
      feeAmount: 1_000_000n,
      totalAmount: 11_000_000n,
      subtotal: "10",
      fee: "1",
      total: "11",
    },
    quote: 5_000_000_000_000_000_000n,
    minimumOutput: 4_750_000_000_000_000_000n,
    quoteFormatted: "5",
    usdcBalance: 20_000_000n,
    usdcBalanceFormatted: "20",
    hasSufficientBalance: true,
    status: "ready",
    error: null,
    txHash: null,
    disabledReason: null,
    canPurchase: true,
    executePurchase: vi.fn().mockResolvedValue("0x123"),
    refreshQuote: vi.fn(),
    ...overrides,
  };
}

function renderDialog() {
  return render(
    <PurchaseDialog
      isOpen
      onClose={vi.fn()}
      tokenAddress={SEPOLIA_CONFIG.tokens[0].address}
      tokenSymbol="AMMO"
    />
  );
}

describe("PurchaseDialog", () => {
  beforeEach(() => {
    mocks.useAccount.mockReturnValue({
      isConnected: true,
      chainId: SEPOLIA_CONFIG.chainId,
    });
    mocks.usePurchase.mockReturnValue(purchaseState());
  });

  it("keeps Connect Wallet enabled and opens the connector", () => {
    mocks.useAccount.mockReturnValue({
      isConnected: false,
      chainId: undefined,
    });
    mocks.usePurchase.mockReturnValue(
      purchaseState({ canPurchase: true })
    );
    renderDialog();

    const button = screen.getByRole("button", { name: "Connect Wallet" });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(mocks.openConnectModal).toHaveBeenCalledOnce();
  });

  it("disables purchase and explains insufficient USDC", () => {
    mocks.usePurchase.mockReturnValue(
      purchaseState({
        hasSufficientBalance: false,
        canPurchase: false,
        disabledReason: "Insufficient USDC balance.",
      })
    );
    renderDialog();

    expect(
      screen.getByRole("button", { name: "Complete Purchase" })
    ).toBeDisabled();
    expect(
      screen.getByText("Insufficient balance: purchase requires 11 USDC.")
    ).toBeInTheDocument();
  });

  it.each([
    ["quoting", "Fetching exact-input quote…"],
    ["approving-erc20", "Approving USDC for Permit2 (one-time setup)…"],
    ["signing-permit", "Sign the Permit2 authorization in your wallet…"],
    ["swapping", "Submitting swap and waiting for confirmation…"],
    ["success", "Purchase confirmed."],
  ])("renders %s state", (status, message) => {
    mocks.usePurchase.mockReturnValue(
      purchaseState({
        status,
        canPurchase: status === "success",
        disabledReason:
          status === "success" ? null : "Transaction in progress.",
      })
    );
    renderDialog();

    expect(screen.getByRole("status")).toHaveTextContent(message);
  });
});
