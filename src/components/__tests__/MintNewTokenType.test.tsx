import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MintNewTokenType } from "../admin/MintNewTokenType";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { parseEther } from "viem";
import { sepolia } from "viem/chains";

// Mock the wagmi hooks
jest.mock("wagmi", () => ({
  useAccount: jest.fn(),
  useWaitForTransactionReceipt: jest.fn(),
  useWriteContract: jest.fn(),
}));

describe("MintNewTokenType", () => {
  const mockOnBack = jest.fn();
  const mockWriteContract = jest.fn();
  const mockChainId = sepolia.id;
  const mockTxHash = "0x123456789abcdef" as `0x${string}`;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useAccount hook
    (useAccount as jest.Mock).mockReturnValue({
      chainId: mockChainId,
    });

    // Mock useWriteContract hook
    (useWriteContract as jest.Mock).mockReturnValue({
      writeContract: mockWriteContract,
    });

    // Default state for transaction receipt hook - not loading, not success, not error
    (useWaitForTransactionReceipt as jest.Mock).mockReturnValue({
      isLoading: false,
      isSuccess: false,
      isError: false,
    });
  });

  it("renders the initial form", () => {
    render(<MintNewTokenType onBack={mockOnBack} />);

    expect(screen.getByText("Mint New Token Type")).toBeInTheDocument();
    expect(screen.getByLabelText("Token Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Token Symbol")).toBeInTheDocument();
    expect(screen.getByLabelText("Initial Supply")).toBeInTheDocument();
    expect(screen.getByText("Back")).toBeInTheDocument();
    expect(screen.getByText("Create Token")).toBeInTheDocument();
    expect(screen.getByText("Create Token")).toBeDisabled();
  });

  it("enables the create button when form is filled", () => {
    render(<MintNewTokenType onBack={mockOnBack} />);

    // Initially the button should be disabled
    expect(screen.getByText("Create Token")).toBeDisabled();

    // Fill in the form
    fireEvent.change(screen.getByLabelText("Token Name"), {
      target: { value: "Test Token" },
    });
    fireEvent.change(screen.getByLabelText("Token Symbol"), {
      target: { value: "TEST" },
    });
    fireEvent.change(screen.getByLabelText("Initial Supply"), {
      target: { value: "1000" },
    });

    // Now the button should be enabled
    expect(screen.getByText("Create Token")).not.toBeDisabled();
  });

  it("shows validation errors for empty fields", () => {
    render(<MintNewTokenType onBack={mockOnBack} />);

    // Click create without filling the form
    fireEvent.click(screen.getByText("Create Token"));

    // Should show validation error
    expect(screen.getByText("Please fill in all fields")).toBeInTheDocument();
  });

  it("transitions to submitting state when creating token", async () => {
    // Setup the mock to not immediately resolve
    mockWriteContract.mockImplementation(() => {
      // Don't call onSuccess or onError yet
    });

    render(<MintNewTokenType onBack={mockOnBack} />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText("Token Name"), {
      target: { value: "Test Token" },
    });
    fireEvent.change(screen.getByLabelText("Token Symbol"), {
      target: { value: "TEST" },
    });
    fireEvent.change(screen.getByLabelText("Initial Supply"), {
      target: { value: "1000" },
    });

    // Click create
    fireEvent.click(screen.getByText("Create Token"));

    // Should transition to submitting state
    await waitFor(() => {
      expect(screen.getByText("Confirm Transaction")).toBeInTheDocument();
      expect(
        screen.getByText("Waiting for wallet confirmation")
      ).toBeInTheDocument();
    });

    // Verify writeContract was called with correct args
    expect(mockWriteContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "createToken",
        args: ["Test Token", "TEST", parseEther("1000")],
      }),
      expect.anything()
    );
  });

  it("transitions to pending state when transaction is submitted", async () => {
    // Setup the mock to resolve with a transaction hash
    mockWriteContract.mockImplementation((_, callbacks) => {
      callbacks.onSuccess(mockTxHash);
    });

    // Mock transaction as pending
    (useWaitForTransactionReceipt as jest.Mock).mockReturnValue({
      isLoading: true,
      isSuccess: false,
      isError: false,
    });

    render(<MintNewTokenType onBack={mockOnBack} />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText("Token Name"), {
      target: { value: "Test Token" },
    });
    fireEvent.change(screen.getByLabelText("Token Symbol"), {
      target: { value: "TEST" },
    });
    fireEvent.change(screen.getByLabelText("Initial Supply"), {
      target: { value: "1000" },
    });

    // Click create
    fireEvent.click(screen.getByText("Create Token"));

    // Should transition to pending state
    await waitFor(() => {
      expect(screen.getByText("Transaction Pending")).toBeInTheDocument();
      expect(screen.getByText("Waiting for confirmation")).toBeInTheDocument();
    });
  });

  it("transitions to success state when transaction is confirmed", async () => {
    // Setup the mock to resolve with a transaction hash
    mockWriteContract.mockImplementation((_, callbacks) => {
      callbacks.onSuccess(mockTxHash);
    });

    // First render with transaction as not yet confirmed
    const { rerender } = render(<MintNewTokenType onBack={mockOnBack} />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText("Token Name"), {
      target: { value: "Test Token" },
    });
    fireEvent.change(screen.getByLabelText("Token Symbol"), {
      target: { value: "TEST" },
    });
    fireEvent.change(screen.getByLabelText("Initial Supply"), {
      target: { value: "1000" },
    });

    // Click create
    fireEvent.click(screen.getByText("Create Token"));

    // Now update the mock to show transaction as confirmed
    (useWaitForTransactionReceipt as jest.Mock).mockReturnValue({
      isLoading: false,
      isSuccess: true,
      isError: false,
    });

    // Re-render with the updated mock
    rerender(<MintNewTokenType onBack={mockOnBack} />);

    // Should transition to success state
    await waitFor(() => {
      expect(screen.getByText("Success!")).toBeInTheDocument();
      expect(screen.getByText("Transaction Confirmed")).toBeInTheDocument();
      expect(screen.getByText("Create Another Token")).toBeInTheDocument();
      expect(screen.getByText("Done")).toBeInTheDocument();
    });
  });

  it("transitions to error state when transaction fails", async () => {
    // Setup the mock to fail with an error
    mockWriteContract.mockImplementation((_, callbacks) => {
      callbacks.onError(new Error("Transaction failed"));
    });

    render(<MintNewTokenType onBack={mockOnBack} />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText("Token Name"), {
      target: { value: "Test Token" },
    });
    fireEvent.change(screen.getByLabelText("Token Symbol"), {
      target: { value: "TEST" },
    });
    fireEvent.change(screen.getByLabelText("Initial Supply"), {
      target: { value: "1000" },
    });

    // Click create
    fireEvent.click(screen.getByText("Create Token"));

    // Should transition to error state
    await waitFor(() => {
      expect(screen.getByText("Error")).toBeInTheDocument();
      expect(screen.getByText("Transaction Failed")).toBeInTheDocument();
      expect(screen.getByText("Transaction failed")).toBeInTheDocument();
      expect(screen.getByText("Try Again")).toBeInTheDocument();
    });
  });

  it("calls onBack when back button is clicked", () => {
    render(<MintNewTokenType onBack={mockOnBack} />);

    fireEvent.click(screen.getByText("Back"));

    expect(mockOnBack).toHaveBeenCalled();
  });

  it("calls onBack when done button is clicked in success state", async () => {
    // Setup the mock to resolve with a transaction hash
    mockWriteContract.mockImplementation((_, callbacks) => {
      callbacks.onSuccess(mockTxHash);
    });

    // Mock transaction as confirmed
    (useWaitForTransactionReceipt as jest.Mock).mockReturnValue({
      isLoading: false,
      isSuccess: true,
      isError: false,
    });

    render(<MintNewTokenType onBack={mockOnBack} />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText("Token Name"), {
      target: { value: "Test Token" },
    });
    fireEvent.change(screen.getByLabelText("Token Symbol"), {
      target: { value: "TEST" },
    });
    fireEvent.change(screen.getByLabelText("Initial Supply"), {
      target: { value: "1000" },
    });

    // Click create
    fireEvent.click(screen.getByText("Create Token"));

    // Wait for success state
    await waitFor(() => {
      expect(screen.getByText("Success!")).toBeInTheDocument();
    });

    // Click done
    fireEvent.click(screen.getByText("Done"));

    expect(mockOnBack).toHaveBeenCalled();
  });

  it("resets the form when Create Another Token is clicked", async () => {
    // Setup the mock to resolve with a transaction hash
    mockWriteContract.mockImplementation((_, callbacks) => {
      callbacks.onSuccess(mockTxHash);
    });

    // Mock transaction as confirmed
    (useWaitForTransactionReceipt as jest.Mock).mockReturnValue({
      isLoading: false,
      isSuccess: true,
      isError: false,
    });

    render(<MintNewTokenType onBack={mockOnBack} />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText("Token Name"), {
      target: { value: "Test Token" },
    });
    fireEvent.change(screen.getByLabelText("Token Symbol"), {
      target: { value: "TEST" },
    });
    fireEvent.change(screen.getByLabelText("Initial Supply"), {
      target: { value: "1000" },
    });

    // Click create
    fireEvent.click(screen.getByText("Create Token"));

    // Wait for success state
    await waitFor(() => {
      expect(screen.getByText("Success!")).toBeInTheDocument();
    });

    // Click create another token
    fireEvent.click(screen.getByText("Create Another Token"));

    // Should be back to the initial form with empty fields
    expect(screen.getByText("Mint New Token Type")).toBeInTheDocument();
    expect(screen.getByLabelText("Token Name")).toHaveValue("");
    expect(screen.getByLabelText("Token Symbol")).toHaveValue("");
    expect(screen.getByLabelText("Initial Supply")).toHaveValue("");
  });
});
