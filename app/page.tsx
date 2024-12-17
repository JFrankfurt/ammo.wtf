import GravitationalCubes from "@/src/components/GravitationalCubes";
import TerminalInput from "@/src/components/Terminal";
import { FC } from "react";

const Home: FC = () => {
  return (
    <div className="relative">
      <TerminalInput />
      <GravitationalCubes />
    </div>
  );
};

export default Home;
