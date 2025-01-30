import { ConnectedAccountInfo } from "@/src/components/ConnectedAccountInfo";
import ConnectedAccountTokenInfo from "@/src/components/ConnectedAccountTokenInfo";
import GravitationalCubes from "@/src/components/GravitationalCubes";
import { FC } from "react";

const Home: FC = () => {
  return (
    <div className="relative">
      <ConnectedAccountTokenInfo />
      <ConnectedAccountInfo />
      <GravitationalCubes />
    </div>
  );
};

export default Home;
