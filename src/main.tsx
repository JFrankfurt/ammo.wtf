import { Buffer } from "buffer";

// Uniswap SDK packages expect Node's Buffer in the browser.
globalThis.Buffer = Buffer;

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "../styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
