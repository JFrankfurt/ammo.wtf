import GravitationalCubes from "@/src/components/GravitationalCubes";
import { FC } from "react";
import ConnectedAccountTokenInfo from "@/src/components/ConnectedAccountTokenInfo";

const Home: FC = () => {
  return (
    <div className="relative">
      <ConnectedAccountTokenInfo />
      <GravitationalCubes />
    </div>
  );
};

export default Home;
