
import type { ReactNode } from "react";

// A polished browser-window chrome used for product mockups across the site.
export default function BrowserMockup({
  url = "marketstack.app",
  children,
  className = "",
}: {
  url?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`keep-dark glow-ring overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d14] ${className}`}>
      <div className="flex items-center gap-3 border-b border-white/5 bg-white/[0.03] px-4 py-3">
        <div className="flex gap-2">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="ml-2 flex flex-1 items-center gap-2 rounded-md bg-black/30 px-3 py-1.5 text-xs text-white/40">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          {url}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
