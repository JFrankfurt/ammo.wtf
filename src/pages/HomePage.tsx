import AdminPanel from "@/components/AdminPanel";
import ConnectedAccountTokenInfo from "@/components/ConnectedAccountTokenInfo";
import GravitationalCubes from "@/components/GravitationalCubes";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FC } from "react";

const HomePage: FC = () => {
  return (
    <div className="relative">
      <ConnectedAccountTokenInfo />
      <div className="fixed top-4 right-4">
        <ConnectButton />
      </div>
      <GravitationalCubes />
      <AdminPanel />
    </div>
  );
};

export default HomePage;
