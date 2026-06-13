import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./globals.css";

import { AuthProvider } from "@/lib/auth";
import SmoothScroll from "@/components/SmoothScroll";
import ThemeToggle from "@/components/ThemeToggle";

// Each route is its own chunk: the landing (GSAP scroll-story) and the tool/runs
// pages load independently, so opening /app doesn't pull in the whole landing.
const Home = lazy(() => import("@/routes/Home"));
const AppPage = lazy(() => import("@/routes/AppPage"));
const RunsPage = lazy(() => import("@/routes/RunsPage"));

function Fallback() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-accent" />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SmoothScroll>
          <Suspense fallback={<Fallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/app" element={<AppPage />} />
              <Route path="/runs" element={<RunsPage />} />
            </Routes>
          </Suspense>
        </SmoothScroll>
        <ThemeToggle />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
