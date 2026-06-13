import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./globals.css";

import { AuthProvider } from "@/lib/auth";
import SmoothScroll from "@/components/SmoothScroll";
import ThemeToggle from "@/components/ThemeToggle";
import Home from "@/routes/Home";
import AppPage from "@/routes/AppPage";
import RunsPage from "@/routes/RunsPage";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SmoothScroll>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/app" element={<AppPage />} />
            <Route path="/runs" element={<RunsPage />} />
          </Routes>
        </SmoothScroll>
        <ThemeToggle />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
