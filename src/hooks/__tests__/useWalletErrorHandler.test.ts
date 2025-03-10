import { renderHook, act } from "@testing-library/react";
import { useWalletErrorHandler } from "../useWalletErrorHandler";

describe("useWalletErrorHandler", () => {
  it("should initialize with null error", () => {
    const { result } = renderHook(() => useWalletErrorHandler());

    expect(result.current.error).toBeNull();
    expect(result.current.isUserRejection).toBe(false);
  });

  it("should handle user rejection errors", () => {
    const { result } = renderHook(() => useWalletErrorHandler());

    act(() => {
      result.current.handleError("User denied transaction signature");
    });

    expect(result.current.error).toBe("User denied transaction signature");
    expect(result.current.isUserRejection).toBe(true);
  });

  it("should handle contract errors", () => {
    const { result } = renderHook(() => useWalletErrorHandler());

    act(() => {
      result.current.handleError(
        "execution reverted: ERC20: transfer amount exceeds balance"
      );
    });

    expect(result.current.error).toBe(
      "execution reverted: ERC20: transfer amount exceeds balance"
    );
    expect(result.current.isUserRejection).toBe(false);
  });

  it("should clear errors", () => {
    const { result } = renderHook(() => useWalletErrorHandler());

    act(() => {
      result.current.handleError("User denied transaction signature");
    });

    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isUserRejection).toBe(false);
  });
});
