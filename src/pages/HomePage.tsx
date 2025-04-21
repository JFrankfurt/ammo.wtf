import React, { FC, Suspense, lazy } from "react";
import ConnectedAccountTokenInfo from "@/components/ConnectedAccountTokenInfo";
// import GravitationalCubes from "@/components/GravitationalCubes"; // Remove static import
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { cn } from "@/utils/cn";

// Dynamically import components
const AdminPanel = lazy(() => import("@/components/AdminPanel"));
const GravitationalCubes = lazy(
  () => import("@/components/GravitationalCubes")
); // Dynamic import

const HomePage: FC = () => {
  return (
    <div className={cn("relative")}>
      {/* Components needed immediately */}
      <ConnectedAccountTokenInfo />
      <div className="fixed top-4 right-4 z-50">
        <ConnectButton />
      </div>

      {/* Dynamically loaded components */}
      <Suspense fallback={null}>
        <GravitationalCubes />
      </Suspense>
      <Suspense fallback={null}>
        <AdminPanel />
      </Suspense>
    </div>
  );
};

export default HomePage;
