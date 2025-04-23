import { Buffer } from "buffer";

// Polyfill globalThis.Buffer for browser compatibility
// This needs to be done very early, before other imports that might rely on it.
if (typeof window !== "undefined") {
  (window as any).globalThis = window.globalThis || window;
  (window as any).globalThis.Buffer = Buffer;
}

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "../styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
