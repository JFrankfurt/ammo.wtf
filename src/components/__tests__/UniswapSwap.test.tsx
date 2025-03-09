import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { UniswapSwap } from "../PurchaseAmmoDialog";
import { useAccount } from "wagmi";
import { useUniswapSwap } from "../../hooks/useUniswapSwap";
import { sepolia } from "viem/chains";

// Mock the wagmi hooks
jest.mock("wagmi", () => ({
  useAccount: jest.fn(),
}));

// Mock our custom hook
jest.mock("../../hooks/useUniswapSwap", () => ({
  useUniswapSwap: jest.fn(),
}));

describe("UniswapSwap", () => {
  const mockSwap = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();
  const validAddress = "0x5ccD30e539F24F34b870b8480d37e31f6D6F3ac7";

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useAccount hook
    (useAccount as jest.Mock).mockReturnValue({
      chain: sepolia,
    });

    // Mock useUniswapSwap hook
    (useUniswapSwap as jest.Mock).mockReturnValue({
      swap: mockSwap,
      loading: false,
      error: null,
      txHash: null,
    });

    // Mock useAccount hook
    (useAccount as jest.Mock).mockReturnValue({
      chain: sepolia,
    });
  });

  it("renders without crashing", () => {
    render(<UniswapSwap />);
    expect(screen.getByText("Swap USDC for Ammo")).toBeInTheDocument();
  });

  it("handles successful swap", async () => {
    const txHash = "0x123";
    mockSwap.mockResolvedValueOnce(txHash);

    render(<UniswapSwap onSuccess={mockOnSuccess} />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText("Select Ammo Token"), {
      target: { value: validAddress },
    });
    fireEvent.change(screen.getByLabelText("USDC Amount"), {
      target: { value: "100" },
    });

    // Click swap button
    fireEvent.click(screen.getByText("Swap"));

    await waitFor(() => {
      expect(mockSwap).toHaveBeenCalledWith(validAddress, "100");
      expect(mockOnSuccess).toHaveBeenCalledWith(txHash);
    });
  });

  it("handles swap error", async () => {
    const error = new Error("Swap failed");
    mockSwap.mockRejectedValueOnce(error);

    render(<UniswapSwap onError={mockOnError} />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText("Select Ammo Token"), {
      target: { value: validAddress },
    });
    fireEvent.change(screen.getByLabelText("USDC Amount"), {
      target: { value: "100" },
    });

    // Click swap button
    fireEvent.click(screen.getByText("Swap"));

    await waitFor(() => {
      expect(mockSwap).toHaveBeenCalledWith(validAddress, "100");
      expect(mockOnError).toHaveBeenCalledWith(error);
    });
  });

  it("disables swap button when form is incomplete", () => {
    render(<UniswapSwap />);
    const swapButton = screen.getByText("Swap");
    expect(swapButton).toBeDisabled();

    // Fill in only the token
    fireEvent.change(screen.getByLabelText("Select Ammo Token"), {
      target: { value: validAddress },
    });
    expect(swapButton).toBeDisabled();

    // Fill in the amount
    fireEvent.change(screen.getByLabelText("USDC Amount"), {
      target: { value: "100" },
    });
    expect(swapButton).not.toBeDisabled();
  });
});
