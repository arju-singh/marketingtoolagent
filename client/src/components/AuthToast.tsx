import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getSupabase } from "@/lib/supabase";

interface Toast {
  kind: "error" | "success";
  msg: string;
}

// Surfaces the result of a Supabase OAuth redirect. Supabase sends provider errors
// back on the redirect URL as ?error=…&error_description=… (or in the hash), which
// would otherwise vanish silently. We show them; on success we confirm sign-in.
export default function AuthToast() {
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const errRaw =
      search.get("error_description") || hash.get("error_description") || search.get("error") || hash.get("error");
    const cameFromOAuth = search.has("code") || hash.has("access_token") || !!errRaw;

    if (errRaw) {
      setToast({ kind: "error", msg: decodeURIComponent(errRaw.replace(/\+/g, " ")) });
      // Strip only the error params (NOT `code` — Supabase needs it to exchange the session).
      const url = new URL(window.location.href);
      ["error", "error_code", "error_description", "state"].forEach((k) => url.searchParams.delete(k));
      url.hash = "";
      window.history.replaceState({}, "", url.pathname + url.search);
      return;
    }

    // Success path: only when we actually returned from the provider.
    if (!cameFromOAuth) return;
    const sb = getSupabase();
    if (!sb) return;
    const { data: sub } = sb.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        setToast({ kind: "success", msg: "Signed in" });
        sub.subscription.unsubscribe();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.kind === "error" ? 9000 : 3000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          className="fixed left-1/2 top-5 z-[60] -translate-x-1/2"
        >
          <div
            className={`glass flex items-center gap-3 rounded-full px-5 py-2.5 text-sm ${
              toast.kind === "error" ? "text-red-200" : "text-accent2"
            }`}
            role="status"
          >
            <span>{toast.kind === "error" ? "⚠️" : "✓"}</span>
            <span className="max-w-sm">{toast.kind === "error" ? `Sign-in failed: ${toast.msg}` : toast.msg}</span>
            <button onClick={() => setToast(null)} className="ml-1 text-white/40 hover:text-white">✕</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
