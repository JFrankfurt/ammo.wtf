import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Providers } from "./providers";
import LoadingFallback from "./components/LoadingFallback";
import { ErrorBoundary } from "./components/ErrorBoundary";

const HomePage = lazy(() => import("./pages/HomePage"));

function App() {
  return (
    <ErrorBoundary>
      <Providers>
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </Providers>
    </ErrorBoundary>
  );
}

export default App;
