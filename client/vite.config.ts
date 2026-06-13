import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    port: 5173,
    // Dev: proxy API calls to the Express server so the client can use relative /api paths.
    proxy: { "/api": "http://localhost:8787" },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Stable vendor chunks for better long-term caching. gsap/lenis/jszip are
        // already split out via dynamic import().
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          motion: ["framer-motion"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
});
