import { renderHook, act } from "@testing-library/react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useUniswapSwap } from "../useUniswapSwap";
import { sepolia } from "viem/chains";

// Mock wagmi hooks
jest.mock("wagmi", () => ({
  useAccount: jest.fn(),
  usePublicClient: jest.fn(),
  useWalletClient: jest.fn(),
}));

xdescribe("useUniswapSwap", () => {
  const mockAddress = "0x5ccD30e539F24F34b870b8480d37e31f6D6F3ac7";
  const mockTokenAddress = "0x448e52b9871fa281816af0b8b122cee52229ebaf";
  const mockWalletClient = {
    sendTransaction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock hook returns
    (useAccount as jest.Mock).mockReturnValue({
      address: mockAddress,
    });
    (usePublicClient as jest.Mock).mockReturnValue({});
    (useWalletClient as jest.Mock).mockReturnValue({
      data: mockWalletClient,
    });
  });

  it("initializes with default state", () => {
    const { result } = renderHook(() => useUniswapSwap(sepolia.id));

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.txHash).toBeNull();
  });

  it("handles successful swap", async () => {
    const txHash = "0xtxHash";
    mockWalletClient.sendTransaction.mockResolvedValueOnce(txHash);

    const { result } = renderHook(() => useUniswapSwap(sepolia.id));

    await act(async () => {
      await result.current.swap(mockTokenAddress, "100");
    });

    expect(mockWalletClient.sendTransaction).toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.txHash).toBe(txHash);
  });

  it("handles swap failure", async () => {
    const error = new Error("Swap failed");
    mockWalletClient.sendTransaction.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useUniswapSwap(sepolia.id));

    await act(async () => {
      try {
        await result.current.swap(mockTokenAddress, "100");
      } catch (err) {
        expect(err).toBe(error);
      }
    });

    expect(mockWalletClient.sendTransaction).toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(error);
    expect(result.current.txHash).toBeNull();
  });

  it("handles wallet not connected", async () => {
    (useAccount as jest.Mock).mockReturnValue({ address: null });
    (useWalletClient as jest.Mock).mockReturnValue({ data: null });

    const { result } = renderHook(() => useUniswapSwap(sepolia.id));

    await act(async () => {
      await result.current.swap(mockTokenAddress, "100");
    });

    expect(mockWalletClient.sendTransaction).not.toHaveBeenCalled();
    expect(result.current.error?.message).toBe("Wallet not connected");
  });
});
