"use client";
import AppProviders from "@/app/AppProviders";
import Link from "next/link";
import { useAccount, useReadContract } from "wagmi";

function L() {
  const { address } = useAccount();
  const { data } = useReadContract({
    abi: [],
    address: "0x",
    functionName: "adminList",
  });
  if (address && data && Array.isArray(data) && data.includes(address)) {
    return <Link href="/dashboard/admin">admin dashboard</Link>;
  }
  return null;
}

export const AdminLink = () => {
  return (
    <AppProviders>
      <L />
    </AppProviders>
  );
};

export default AdminLink;
