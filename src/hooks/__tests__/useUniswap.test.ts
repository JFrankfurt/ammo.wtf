import { renderHook, act } from "@testing-library/react-hooks";
import { useUniswap } from "../useUniswap";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

// Mock wagmi hooks
jest.mock("wagmi", () => ({
  useAccount: jest.fn(),
  usePublicClient: jest.fn(),
  useWalletClient: jest.fn(),
}));

// Mock viem functions
jest.mock("viem", () => ({
  encodeFunctionData: jest.fn(() => "0x123456"),
  encodePacked: jest.fn(() => "0x123456" as `0x${string}`),
  formatUnits: jest.fn((value) => "10.0"),
  parseUnits: jest.fn((value) => BigInt(10000000)),
}));

describe("useUniswap", () => {
  // Setup mock data
  const mockAddress = "0x1234567890123456789012345678901234567890";
  const mockPublicClient = {
    readContract: jest.fn(),
    simulateContract: jest.fn(),
    waitForTransactionReceipt: jest.fn(),
  };
  const mockWalletClient = {
    writeContract: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock implementations
    (useAccount as jest.Mock).mockReturnValue({ address: mockAddress });
    (usePublicClient as jest.Mock).mockReturnValue(mockPublicClient);
    (useWalletClient as jest.Mock).mockReturnValue({ data: mockWalletClient });

    mockPublicClient.readContract.mockResolvedValue(BigInt(18));
    mockPublicClient.simulateContract.mockResolvedValue({
      result: BigInt(1000000000000000000),
    });
    mockPublicClient.waitForTransactionReceipt.mockResolvedValue({
      status: "success",
    });
    mockWalletClient.writeContract.mockResolvedValue("0xmocktxhash");
  });

  it("should initialize with correct default state", () => {
    const { result } = renderHook(() => useUniswap(1));

    expect(result.current.state).toEqual({
      loading: false,
      error: null,
      txHash: null,
      quote: null,
    });
  });

  it("should get a quote for a swap", async () => {
    const { result, waitForNextUpdate } = renderHook(() => useUniswap(1));

    const swapParams = {
      tokenIn: "0xtoken1",
      tokenOut: "0xtoken2",
      amount: "10",
      slippagePercentage: 0.5,
    };

    act(() => {
      result.current.getQuote(swapParams);
    });

    // Check loading state
    expect(result.current.state.loading).toBe(true);

    await waitForNextUpdate();

    // Check final state
    expect(result.current.state.loading).toBe(false);
    expect(result.current.state.error).toBe(null);
    expect(result.current.state.quote).not.toBe(null);
  });

  it("should check and approve a token", async () => {
    const { result } = renderHook(() => useUniswap(1));

    // Mock allowance check to return insufficient allowance
    mockPublicClient.readContract.mockResolvedValueOnce(BigInt(0));

    let approved;
    await act(async () => {
      approved = await result.current.checkAndApproveToken("0xtoken1", "10");
    });

    expect(approved).toBe(true);
    expect(mockPublicClient.readContract).toHaveBeenCalled();
    expect(mockPublicClient.simulateContract).toHaveBeenCalled();
    expect(mockWalletClient.writeContract).toHaveBeenCalled();
  });

  it("should execute a swap", async () => {
    const { result, waitForNextUpdate } = renderHook(() => useUniswap(1));

    // First get a quote to set up the swap config
    const swapParams = {
      tokenIn: "0xtoken1",
      tokenOut: "0xtoken2",
      amount: "10",
      slippagePercentage: 0.5,
    };

    act(() => {
      result.current.getQuote(swapParams);
    });

    await waitForNextUpdate();

    // Mock token approval
    jest
      .spyOn(result.current, "checkAndApproveToken")
      .mockResolvedValueOnce(true);

    let txHash;
    await act(async () => {
      txHash = await result.current.swap(swapParams);
    });

    expect(txHash).toBe("0xmocktxhash");
    expect(result.current.state.txHash).toBe("0xmocktxhash");
    expect(result.current.state.loading).toBe(false);
  });

  it("should handle errors during quote", async () => {
    const { result, waitForNextUpdate } = renderHook(() => useUniswap(1));

    // Mock an error during simulation
    mockPublicClient.simulateContract.mockRejectedValueOnce(
      new Error("Simulation failed")
    );

    const swapParams = {
      tokenIn: "0xtoken1",
      tokenOut: "0xtoken2",
      amount: "10",
      slippagePercentage: 0.5,
    };

    act(() => {
      result.current.getQuote(swapParams);
    });

    await waitForNextUpdate();

    expect(result.current.state.loading).toBe(false);
    expect(result.current.state.error).not.toBe(null);
    expect(result.current.state.error?.message).toBe("Simulation failed");
  });
});
