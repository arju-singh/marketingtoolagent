import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export default function AuthButton() {
  const { user, enabled, loading, signIn, logout } = useAuth();
  const [busy, setBusy] = useState(false);

  // signIn() redirects the whole page to Google; show a spinner during the kickoff.
  const handleSignIn = async () => {
    setBusy(true);
    try {
      await signIn();
    } catch {
      setBusy(false);
    }
  };

  // Hide entirely when Supabase isn't configured — the tool still works without it.
  if (!enabled) return null;
  if (loading) return <span className="text-sm text-white/30">…</span>;

  if (user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Link to="/runs" className="text-white/60 hover:text-white">My runs</Link>
        {user.avatar && (
          <img src={user.avatar} alt="" className="h-7 w-7 rounded-full" />
        )}
        <button onClick={logout} className="text-white/50 hover:text-white">Sign out</button>
      </div>
    );
  }

  return (
    <button onClick={handleSignIn} disabled={busy} className="btn-ghost !py-2 !text-sm disabled:opacity-60">
      {busy ? (
        <>
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          Redirecting…
        </>
      ) : (
        "Sign in with Google"
      )}
    </button>
  );
}
