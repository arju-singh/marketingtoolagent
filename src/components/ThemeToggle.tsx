"use client";

import { useEffect, useState } from "react";

// Floating dark/light switch. Persists to localStorage; the inline script in
// layout.tsx applies the saved theme before paint to avoid a flash.
export default function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.classList.contains("light"));
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    try {
      localStorage.setItem("ms_theme", next ? "light" : "dark");
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="glass fixed bottom-5 right-5 z-40 grid h-11 w-11 place-items-center rounded-full text-lg transition-transform hover:scale-105"
    >
      {light ? "🌙" : "☀️"}
    </button>
  );
}
