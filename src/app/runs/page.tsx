"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { listRuns, type SavedRun } from "@/lib/runs";
import AuthButton from "@/components/AuthButton";
import { downloadZip } from "@/lib/export";

export default function RunsPage() {
  const { user, enabled, loading } = useAuth();
  const [runs, setRuns] = useState<SavedRun[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!user) {
      setBusy(false);
      return;
    }
    listRuns(user.uid)
      .then(setRuns)
      .finally(() => setBusy(false));
  }, [user]);

  return (
    <main className="grid-bg min-h-screen">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-lg font-bold">Market<span className="gradient-text">Stack</span></Link>
        <div className="flex items-center gap-4">
          <AuthButton />
          <Link href="/app" className="text-sm text-white/50 hover:text-white">Open the tool →</Link>
        </div>
      </nav>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-bold">My runs</h1>

        {!enabled && (
          <p className="mt-4 text-white/55">Firebase isn’t configured, so runs aren’t persisted. Add your Firebase env vars to enable history.</p>
        )}
        {enabled && !loading && !user && (
          <p className="mt-4 text-white/55">Sign in to see your saved marketing runs.</p>
        )}
        {enabled && user && busy && <p className="mt-4 text-white/40">Loading…</p>}
        {enabled && user && !busy && runs.length === 0 && (
          <p className="mt-4 text-white/55">No runs yet. <Link href="/app" className="text-accent2">Generate your first suite →</Link></p>
        )}

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {runs.map((r) => (
            <div key={r.id} className="glass rounded-2xl p-5">
              <div className="font-semibold">{r.productName}</div>
              <div className="mt-1 line-clamp-2 text-sm text-white/55">{r.oneLiner}</div>
              <div className="mt-3 flex items-center justify-between text-xs text-white/40">
                <span>{r.deliverables.filter((d) => d.ok).length} deliverables · {new Date(r.createdAt).toLocaleDateString()}</span>
                <button onClick={() => downloadZip(r.context, r.deliverables)} className="rounded bg-white/5 px-2 py-1 hover:bg-white/10">⬇ .zip</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
