import AMMO_TOKEN_ERC20_ABI from "@/abi/ammoTokenERC20";
import { useCallback } from "react";
import { parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useSimulateContract,
  useWriteContract,
} from "wagmi";

// todo: write proxy swap contract
const SPENDING_CONTRACT = "0x";

export function useApproveToken(tokenAddress: string, amount: string) {
  const { address } = useAccount();
  const { data: allowance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: AMMO_TOKEN_ERC20_ABI,
    functionName: "allowance",
    args: [address!, SPENDING_CONTRACT!],
    query: {
      enabled: !!address,
    },
  });

  const { writeContractAsync } = useWriteContract();
  const decimalsIn = 6; // USDC has 6 decimals
  const parsedAmount = parseUnits(amount, decimalsIn) * 10n;

  const { data: request } = useSimulateContract({
    address: tokenAddress as `0x${string}`,
    abi: AMMO_TOKEN_ERC20_ABI,
    functionName: "approve",
    args: [SPENDING_CONTRACT, parsedAmount],
    account: address,
    query: {
      enabled: Boolean(!!address && allowance && allowance < parsedAmount),
    },
  });
  return useCallback(() => {
    if (request) {
      writeContractAsync({
        address: tokenAddress as `0x${string}`,
        abi: AMMO_TOKEN_ERC20_ABI,
        functionName: "approve",
        args: [SPENDING_CONTRACT, parsedAmount],
        account: address,
      });
    }
  }, [request, writeContractAsync, tokenAddress, address, parsedAmount]);
}
