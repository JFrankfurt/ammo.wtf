import AdminPanel from "@/src/components/AdminPanel";
import ConnectedAccountTokenInfo from "@/src/components/ConnectedAccountTokenInfo";
import GravitationalCubes from "@/src/components/GravitationalCubes";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FC } from "react";

const Home: FC = () => {
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

export default Home;
