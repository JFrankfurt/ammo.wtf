import { parseWalletError, formatWalletError } from "../walletErrors";

describe("Wallet Error Utilities", () => {
  describe("parseWalletError", () => {
    it("should handle null or undefined errors", () => {
      const result = parseWalletError(null);
      expect(result.title).toBe("Transaction Failed");
      expect(result.message).toBe(
        "There was an error processing your transaction."
      );
      expect(result.isUserRejection).toBe(false);
    });

    it("should detect user rejection errors", () => {
      const userRejectionErrors = [
        "User denied transaction signature",
        "User rejected the request",
        "MetaMask Tx Signature: User denied transaction signature",
        "Error: user rejected transaction",
        "The transaction was rejected by user",
      ];

      userRejectionErrors.forEach((error) => {
        const result = parseWalletError(error);
        expect(result.title).toBe("Transaction Cancelled");
        expect(result.message).toBe("You cancelled the transaction.");
        expect(result.isUserRejection).toBe(true);
      });
    });

    it("should detect insufficient funds errors", () => {
      const insufficientFundsErrors = [
        "insufficient funds for gas",
        "InsufficientFunds",
        "Error: insufficient balance for transfer",
      ];

      insufficientFundsErrors.forEach((error) => {
        const result = parseWalletError(error);
        expect(result.title).toBe("Insufficient Funds");
        expect(result.isUserRejection).toBe(false);
      });
    });

    it("should detect gas-related errors", () => {
      const gasErrors = [
        "gas required exceeds allowance",
        "out of gas",
        "transaction underpriced: gas limit too low",
      ];

      gasErrors.forEach((error) => {
        const result = parseWalletError(error);
        expect(result.title).toBe("Gas Error");
        expect(result.isUserRejection).toBe(false);
      });
    });

    it("should detect contract execution errors", () => {
      const error =
        "execution reverted: ERC20: transfer amount exceeds balance";
      const result = parseWalletError(error);

      expect(result.title).toBe("Contract Error");
      expect(result.message).toBe(
        "The transaction was rejected by the smart contract."
      );
      expect(result.details).toBe("ERC20: transfer amount exceeds balance");
      expect(result.isUserRejection).toBe(false);
    });

    it("should extract function name from contract call errors", () => {
      const error =
        "User rejected the request. Request Arguments: from: 0x48c89D77ae34Ae475e4523b25aB01e363dce5A78 to: 0x8404176e3b00d1f2ccd07e9aad037cd8ca9e0ee7 data: 0x10badf4e Contract Call: address: 0x8404176e3b00d1f2ccd07e9aad037cd8ca9e0ee7 function: redeem(address to, uint256 amount, bytes encryptedShippingData)";

      const result = parseWalletError(error);
      expect(result.title).toBe("Transaction Cancelled");
      expect(result.message).toBe("You cancelled the transaction.");
      expect(result.isUserRejection).toBe(true);
    });

    it("sanitizes rejection errors containing request details", () => {
      const error =
        "User rejected the request. Request Arguments: data: 0xdeadbeef. Details: User denied transaction signature.";

      const result = parseWalletError(error);
      expect(result.title).toBe("Transaction Cancelled");
      expect(result.message).toBe("You cancelled the transaction.");
      expect(result.isUserRejection).toBe(true);
      expect(result.details).toBeUndefined();
    });
  });

  describe("formatWalletError", () => {
    it("should format errors for display", () => {
      const error = "User denied transaction signature";
      const result = formatWalletError(error);

      expect(result.title).toBe("Transaction Cancelled");
      expect(result.message).toBe("You cancelled the transaction.");
      expect(result.details).toBeUndefined();
    });

    it("should include details when available", () => {
      const error =
        "execution reverted: ERC20: transfer amount exceeds balance";
      const result = formatWalletError(error);

      expect(result.title).toBe("Contract Error");
      expect(result.message).toBe(
        "The transaction was rejected by the smart contract."
      );
      expect(result.details).toBe("ERC20: transfer amount exceeds balance");
    });
  });
});
