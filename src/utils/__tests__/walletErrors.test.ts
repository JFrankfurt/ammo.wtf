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

    it("should handle the specific MetaMask error from the example", () => {
      const error =
        "User rejected the request. Request Arguments: from: 0x48c89D77ae34Ae475e4523b25aB01e363dce5A78 to: 0x8404176e3b00d1f2ccd07e9aad037cd8ca9e0ee7 data: 0x10badf4e00000000000000000000000048c89d77ae34ae475e4523b25ab01e363dce5a780000000000000000000000000000000000000000000000bdbc41e0348b30000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000213e6634fd12b051f65988b8a80ca748cdeaa52bc1b01bf357dedbb3650cd3d71fe9e9413049f7de18ce8c4aa81a98125bf224e13555fda5b2ff09c803d1c138c7585d0b4bd53a5710f43f1e9f3b45e35714c62d6e21dff4f3354a125cd8765023da2f9e266523170fa946496a36256e048134c9aaff3e14089ae0ad984f48c57b4e7afd13ca55b4e13e394ab28f9771407b20e984d588fed3b877c8cd6ee2532bc2f4a0165a6dc1a9d152ed756a14cfcd9dd0d2cbfa85b155902a32842e2f1f3a0f12a48425b73d108dcac380e993d0a0943395ba333a215a87f1516e4da33ace55e86e8be75bd9a217933191482709005fdb2321ab24e74bd58801191457cfc42d563099b95b783e113902bf7145bded71f25dc0b15b11e7f6a1ac8bd60be843a8c77d692b0ad89e431669f1f40f88355e5355164a851522cf50989cf169396651e7f28c93cbd6060e25521c55be069a5e58dd95b225a5a372d14ce67b5aaab5b6d8e5fc14fec34d4e813802f8608add2573a3bcc80776752622fe0aec0a79c6806f83ebba3ba59da11ab5529897657324a576f3a74a30a4a3059301306072a8648ce3d020106082a8648ce3d030107034200048b9ae6bf58b3c05f95cb6be3d9aeffa5d734656f6a0d23d569aaa1f62a1a997a90ab73931cdbf279605882aaefe51d84753c377427fc44528f90969d099ad5dfd58cfb5d9e89e787341e52f1701da9fd926da2bb3216d88962e8810bcaff38f100000000000000000000000000 Contract Call: address: 0x8404176e3b00d1f2ccd07e9aad037cd8ca9e0ee7 function: redeem(address to, uint256 amount, bytes encryptedShippingData) args: (0x48c89D77ae34Ae475e4523b25aB01e363dce5A78, 3500000000000000000000, 0xe6634fd12b051f65988b8a80ca748cdeaa52bc1b01bf357dedbb3650cd3d71fe9e9413049f7de18ce8c4aa81a98125bf224e13555fda5b2ff09c803d1c138c7585d0b4bd53a5710f43f1e9f3b45e35714c62d6e21dff4f3354a125cd8765023da2f9e266523170fa946496a36256e048134c9aaff3e14089ae0ad984f48c57b4e7afd13ca55b4e13e394ab28f9771407b20e984d588fed3b877c8cd6ee2532bc2f4a0165a6dc1a9d152ed756a14cfcd9dd0d2cbfa85b155902a32842e2f1f3a0f12a48425b73d108dcac380e993d0a0943395ba333a215a87f1516e4da33ace55e86e8be75bd9a217933191482709005fdb2321ab24e74bd58801191457cfc42d563099b95b783e113902bf7145bded71f25dc0b15b11e7f6a1ac8bd60be843a8c77d692b0ad89e431669f1f40f88355e5355164a851522cf50989cf169396651e7f28c93cbd6060e25521c55be069a5e58dd95b225a5a372d14ce67b5aaab5b6d8e5fc14fec34d4e813802f8608add2573a3bcc80776752622fe0aec0a79c6806f83ebba3ba59da11ab5529897657324a576f3a74a30a4a3059301306072a8648ce3d020106082a8648ce3d030107034200048b9ae6bf58b3c05f95cb6be3d9aeffa5d734656f6a0d23d569aaa1f62a1a997a90ab73931cdbf279605882aaefe51d84753c377427fc44528f90969d099ad5dfd58cfb5d9e89e787341e52f1701da9fd926da2bb3216d88962e8810bcaff38f1) sender: 0x48c89D77ae34Ae475e4523b25aB01e363dce5A78 Docs: https://viem.sh/docs/contract/writeContract Details: MetaMask Tx Signature: User denied transaction signature. Version: viem@2.21.55";

      const result = parseWalletError(error);
      expect(result.title).toBe("Transaction Cancelled");
      expect(result.message).toBe("You cancelled the transaction.");
      expect(result.isUserRejection).toBe(true);
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
