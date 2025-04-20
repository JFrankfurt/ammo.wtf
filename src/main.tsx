import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App"; // Import the main App component
import "../styles/globals.css"; // Assuming global styles are here

// Placeholder component - No longer needed
// function AppPlaceholder() { ... }

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
