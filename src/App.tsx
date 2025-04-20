import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Providers } from "./providers";
import HomePage from "./pages/HomePage";
import "@rainbow-me/rainbowkit/styles.css";

function App() {
  return (
    <Providers>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </Providers>
  );
}

export default App;
