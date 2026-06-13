"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GOALS, SKILLS, type GoalKey } from "@/lib/skills";
import type { ProductContext, Deliverable } from "@/lib/types";
import { renderMarkdown } from "@/lib/markdown";
import { useAuth } from "@/lib/auth";
import { saveRun } from "@/lib/runs";
import { downloadZip, downloadCombinedMarkdown } from "@/lib/export";
import Paywall from "@/components/Paywall";
import { getPlan, getRuns, hasAccess, recordRun, setPlan, syncDown } from "@/lib/usage";
import { FREE_RUNS, tierById, type Tier } from "@/lib/pricing";

type Phase = "input" | "ingesting" | "configure" | "results";
interface RequestedSkill { key: string; name: string }

export default function AppTool() {
  const [phase, setPhase] = useState<Phase>("input");
  const [githubUrl, setGithubUrl] = useState("");
  const [domain, setDomain] = useState("");
  const [ctx, setCtx] = useState<ProductContext | null>(null);
  const [goals, setGoals] = useState<Set<GoalKey>>(new Set());
  const [advanced, setAdvanced] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [requested, setRequested] = useState<RequestedSkill[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [active, setActive] = useState(0);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const [showPaywall, setShowPaywall] = useState(false);
  const [entitle, setEntitle] = useState<{ free: boolean; plan: string | null }>({ free: true, plan: null });
  const pendingOpts = useRef<{ everything?: boolean } | null>(null);
  const { user, enabled: authEnabled, token: getToken } = useAuth();

  // Reconcile entitlement from Supabase when a user signs in.
  useEffect(() => {
    if (user) void syncDown(user.id);
  }, [user]);

  // Read entitlement after mount (avoids hydration mismatch) and after phase/paywall changes.
  useEffect(() => {
    setEntitle({ free: getRuns() < FREE_RUNS, plan: getPlan() });
  }, [phase, showPaywall, streaming]);

  const skillsByCategory = useMemo(() => {
    const m: Record<string, typeof SKILLS> = {};
    for (const s of SKILLS) (m[s.category] ||= []).push(s);
    return m;
  }, []);

  async function ingest() {
    setError(null);
    if (!githubUrl && !domain) {
      setError("Enter a GitHub URL or a domain (or both).");
      return;
    }
    setPhase("ingesting");
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ githubUrl, domain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ingest failed");
      setCtx(data.context);
      setPhase("configure");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ingest failed");
      setPhase("input");
    }
  }

  async function generate(opts: { everything?: boolean }) {
    if (!ctx) return;
    setError(null);

    // Freemium gate: first run free, then a plan is required.
    if (!hasAccess()) {
      pendingOpts.current = opts;
      setShowPaywall(true);
      return;
    }

    const body: Record<string, unknown> = { context: ctx };
    if (opts.everything) body.everything = true;
    else if (advanced && picked.size) body.skills = [...picked];
    else body.goals = [...goals];

    setDeliverables([]);
    setRequested([]);
    setActive(0);
    setSaved("idle");
    setStreaming(true);
    setPhase("results");

    const collected: Deliverable[] = [];
    try {
      const headers: Record<string, string> = { "content-type": "application/json" };
      const tok = await getToken().catch(() => null);
      if (tok) headers.authorization = `Bearer ${tok}`;

      const res = await fetch("/api/generate/stream", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      // Server-side paywall backstop (e.g. localStorage was cleared but the server knows).
      if (res.status === 402) {
        setStreaming(false);
        pendingOpts.current = opts;
        setPhase("configure");
        setShowPaywall(true);
        return;
      }
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Generation failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let streamErr: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          const msg = JSON.parse(line);
          if (msg.type === "start") setRequested(msg.skills);
          else if (msg.type === "deliverable") {
            collected.push(msg.deliverable);
            setDeliverables((d) => [...d, msg.deliverable]);
          } else if (msg.type === "error") streamErr = msg.error;
        }
      }

      setStreaming(false);
      if (streamErr && collected.length === 0) throw new Error(streamErr);
      if (streamErr) setError(streamErr);
      if (collected.length) recordRun(user?.id); // count this run against the free quota
      if (user && collected.length) {
        setSaved("saving");
        saveRun(user.id, ctx, collected)
          .then((id) => setSaved(id ? "saved" : "idle"))
          .catch(() => setSaved("idle"));
      }
    } catch (e) {
      setStreaming(false);
      setError(e instanceof Error ? e.message : "Generation failed");
      if (collected.length === 0) setPhase("configure");
    }
  }

  const toggle = <T,>(set: Set<T>, val: T, setter: (s: Set<T>) => void) => {
    const next = new Set(set);
    next.has(val) ? next.delete(val) : next.add(val);
    setter(next);
  };

  // After a (simulated) successful payment: unlock and resume the pending generation.
  function onPaid(tier: Tier) {
    setPlan(tier.id, user?.id);
    setShowPaywall(false);
    const opts = pendingOpts.current || {};
    pendingOpts.current = null;
    void generate(opts);
  }

  const canGenerate = advanced ? picked.size > 0 : goals.size > 0;
  const activeSkill = requested[active];
  const activeDeliverable = activeSkill ? deliverables.find((d) => d.skill === activeSkill.key) : undefined;
  const okCount = deliverables.filter((d) => d.ok).length;

  return (
    <div className="mx-auto w-full max-w-5xl">
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* INPUT */}
        {phase === "input" && (
          <Panel key="input">
            <h2 className="text-2xl font-bold">Start with your repo + domain</h2>
            <p className="mt-2 text-white/55">Both are optional, but more input = sharper output.</p>
            <div className="mt-6 space-y-4">
              <Field label="GitHub repo URL" placeholder="https://github.com/owner/project" value={githubUrl} onChange={setGithubUrl} />
              <Field label="Project domain" placeholder="yourproject.com" value={domain} onChange={setDomain} />
            </div>
            <button onClick={ingest} className="btn-primary mt-6">Ingest my product →</button>
          </Panel>
        )}

        {/* INGESTING */}
        {phase === "ingesting" && <Loading key="ingesting" label="Reading your repo and crawling your site…" />}

        {/* CONFIGURE */}
        {phase === "configure" && ctx && (
          <Panel key="configure">
            <h2 className="text-2xl font-bold">{ctx.summary.productName}</h2>
            <p className="mt-1 text-white/60">{ctx.summary.oneLiner}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ctx.summary.techStack.slice(0, 8).map((t) => (
                <span key={t} className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/60">{t}</span>
              ))}
            </div>
            {ctx.notes.length > 0 && <div className="mt-3 text-xs text-amber-300/80">{ctx.notes.join(" ")}</div>}

            <div className="mt-8 flex items-center justify-between">
              <h3 className="font-semibold">{advanced ? "Pick individual skills" : "What do you want?"}</h3>
              <button onClick={() => setAdvanced((a) => !a)} className="text-xs text-accent2 hover:underline">
                {advanced ? "← Back to goals" : "⚙ Advanced: pick skills"}
              </button>
            </div>

            {!advanced ? (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {GOALS.map((g) => (
                  <button
                    key={g.key}
                    onClick={() => toggle(goals, g.key, setGoals)}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      goals.has(g.key) ? "border-accent bg-accent/10" : "border-white/10 hover:border-white/25"
                    }`}
                  >
                    <div className="text-lg">{g.emoji} <span className="font-semibold">{g.label}</span></div>
                    <div className="mt-1 text-sm text-white/55">{g.desc}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-3 space-y-5">
                <div className="flex items-center gap-3 text-xs text-white/50">
                  <span>{picked.size} selected (max 18)</span>
                  <button onClick={() => setPicked(new Set())} className="hover:text-white">Clear</button>
                </div>
                {Object.entries(skillsByCategory).map(([cat, list]) => (
                  <div key={cat}>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">{cat}</div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {list.map((s) => (
                        <label
                          key={s.key}
                          className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 text-sm transition-colors ${
                            picked.has(s.key) ? "border-accent bg-accent/10" : "border-white/10 hover:border-white/25"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={picked.has(s.key)}
                            onChange={() => toggle(picked, s.key, setPicked)}
                            className="mt-0.5 accent-[#6d5efc]"
                          />
                          <span>
                            <span className="font-medium">{s.name}</span>
                            <span className="block text-xs text-white/45">{s.blurb}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 text-xs">
              {entitle.plan ? (
                <span className="rounded-full bg-accent2/15 px-3 py-1 text-accent2">{tierById(entitle.plan)?.name || "Paid"} plan · unlimited</span>
              ) : entitle.free ? (
                <span className="rounded-full bg-white/5 px-3 py-1 text-white/55">✨ Your first project analysis is free</span>
              ) : (
                <span className="rounded-full bg-amber-400/10 px-3 py-1 text-amber-300">Free run used — next run needs a plan (₹777 / ₹888 / ₹999)</span>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={() => generate({})} disabled={!canGenerate} className="btn-primary disabled:opacity-40">
                Generate {advanced ? `${picked.size} skill${picked.size === 1 ? "" : "s"}` : "selected"}
              </button>
              <button onClick={() => generate({ everything: true })} className="btn-ghost">✨ Generate everything</button>
            </div>
          </Panel>
        )}

        {/* RESULTS (progressive) */}
        {phase === "results" && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-white/50">
                {streaming ? (
                  <span>Generating… <span className="text-white/80">{deliverables.length}/{requested.length || "…"}</span></span>
                ) : (
                  <span>{okCount} deliverables for <span className="text-white/80">{ctx?.summary.productName}</span></span>
                )}
                {saved === "saving" && <span className="ml-2 text-white/30">· saving…</span>}
                {saved === "saved" && <span className="ml-2 text-accent2">· saved ✓</span>}
                {authEnabled && !user && !streaming && <span className="ml-2 text-white/30">· sign in to save</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => ctx && downloadCombinedMarkdown(ctx, deliverables)} disabled={!okCount} className="rounded-md bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10 disabled:opacity-40">⬇ Markdown</button>
                <button onClick={() => ctx && downloadZip(ctx, deliverables)} disabled={!okCount} className="rounded-md bg-accent/20 px-3 py-1.5 text-xs text-white hover:bg-accent/30 disabled:opacity-40">⬇ Download .zip</button>
                <button onClick={() => { setPhase("configure"); setSaved("idle"); }} className="rounded-md bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10">+ New set</button>
              </div>
            </div>

            {/* progress bar */}
            <div className="mb-5 h-1 w-full overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full bg-gradient-to-r from-accent to-accent2"
                animate={{ width: requested.length ? `${(deliverables.length / requested.length) * 100}%` : "8%" }}
                transition={{ duration: 0.4 }}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
              <aside className="glass h-fit rounded-2xl p-3">
                <div className="px-2 pb-2 text-xs uppercase tracking-wide text-white/40">Deliverables</div>
                {(requested.length ? requested : [{ key: "_", name: "Starting…" }]).map((s, i) => {
                  const d = deliverables.find((x) => x.skill === s.key);
                  return (
                    <button
                      key={s.key}
                      onClick={() => d && setActive(i)}
                      disabled={!d}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                        active === i && d ? "bg-accent/15 text-white" : d ? "text-white/65 hover:bg-white/5" : "text-white/35"
                      }`}
                    >
                      {d ? <span>{d.ok ? "📄" : "⚠️"}</span> : <Spinner />}
                      <span className="truncate">{s.name}</span>
                    </button>
                  );
                })}
              </aside>

              <article className="glass min-h-[400px] rounded-2xl p-6">
                {activeDeliverable ? (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-xs text-white/40">{activeDeliverable.model}</span>
                      <button onClick={() => navigator.clipboard.writeText(activeDeliverable.markdown)} className="rounded-md bg-white/5 px-3 py-1 text-xs hover:bg-white/10">Copy markdown</button>
                    </div>
                    {activeDeliverable.ok ? (
                      <div
                        className="prose-invert max-w-none text-sm leading-relaxed text-white/85 [&_a]:text-accent2 [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1 [&_h2]:mt-0 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-5 [&_h3]:font-semibold [&_li]:my-1 [&_table]:w-full [&_td]:border [&_td]:border-white/10 [&_td]:p-2 [&_th]:border [&_th]:border-white/10 [&_th]:p-2 [&_ul]:list-disc [&_ul]:pl-5"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(activeDeliverable.markdown) }}
                      />
                    ) : (
                      <div className="text-red-300">Could not generate: {activeDeliverable.error}</div>
                    )}
                  </>
                ) : (
                  <div className="flex h-72 flex-col items-center justify-center text-center text-white/50">
                    <Spinner big />
                    <p className="mt-4">Writing {activeSkill?.name || "your first deliverable"}…</p>
                  </div>
                )}
              </article>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPaywall && <Paywall onPaid={onPaid} onClose={() => setShowPaywall(false)} />}
      </AnimatePresence>
    </div>
  );
}

function Spinner({ big }: { big?: boolean }) {
  return <span className={`inline-block animate-spin rounded-full border-2 border-white/15 border-t-accent ${big ? "h-9 w-9" : "h-3.5 w-3.5"}`} />;
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-2xl p-8"
    >
      {children}
    </motion.div>
  );
}

function Field({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm text-white/60">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-accent"
      />
    </label>
  );
}

function Loading({ label }: { label: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass flex flex-col items-center justify-center rounded-2xl p-16 text-center">
      <Spinner big />
      <p className="mt-5 text-white/60">{label}</p>
    </motion.div>
  );
}
