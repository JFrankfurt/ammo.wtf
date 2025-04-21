import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Providers } from "./providers";
import "@rainbow-me/rainbowkit/styles.css";
import LoadingFallback from "./components/LoadingFallback";

const HomePage = lazy(() => import("./pages/HomePage"));

function App() {
  return (
    <Providers>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </Providers>
  );
}

export default App;
