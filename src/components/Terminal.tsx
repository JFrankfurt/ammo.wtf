"use client";

import { useState } from "react";

const TerminalInput = () => {
  const [command, setCommand] = useState("");

  const handleCommandSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Command entered:", command); // Replace with desired functionality
    setCommand(""); // Clear the input field
  };

  return (
    <form
      onSubmit={handleCommandSubmit}
      className="flex items-center bg-transparent rounded-md font-mono z-20 absolute top-10 left-10"
    >
      <span className="text-black pr-2">❯</span>{" "}
      {/* Command prompt indicator */}
      <input
        autoFocus
        type="text"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        placeholder=""
        className="text-black outline-none border-none focus:outline-none bg-transparent rounded-md"
      />
    </form>
  );
};

export default TerminalInput;
