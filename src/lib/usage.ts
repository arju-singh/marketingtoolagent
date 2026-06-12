"use client";

// Client-side entitlement is OPTIMISTIC UX only. The server (/api/generate*) is authoritative
// when Firebase Admin is configured — it reads/increments runs and a plan is activated only by
// the verified-payment route. The client never writes the authoritative plan to Firestore.
import { doc, getDoc } from "firebase/firestore";
import { getDb } from "./firebase";
import { FREE_RUNS } from "./pricing";

const RUNS_KEY = "ms_runs";
const PLAN_KEY = "ms_plan";

function ls(): Storage | null {
  return typeof window !== "undefined" ? window.localStorage : null;
}

export function getRuns(): number {
  return Number(ls()?.getItem(RUNS_KEY) || "0");
}

export function getPlan(): string | null {
  return ls()?.getItem(PLAN_KEY) || null;
}

/** Optimistic gate: free quota left, or a plan is known locally. Server re-checks on request. */
export function hasAccess(): boolean {
  return getPlan() !== null || getRuns() < FREE_RUNS;
}

export function recordRun(_uid?: string | null) {
  const store = ls();
  if (!store) return;
  store.setItem(RUNS_KEY, String(getRuns() + 1));
}

export function setPlan(tier: string, _uid?: string | null) {
  ls()?.setItem(PLAN_KEY, tier);
}

/** Reflect the server's authoritative usage (plan + runs) into local state on sign-in. */
export async function syncDown(uid: string) {
  const db = getDb();
  const store = ls();
  if (!db || !store) return;
  try {
    const snap = await getDoc(doc(db, "users", uid, "meta", "usage"));
    if (!snap.exists()) return;
    const d = snap.data() as { runs?: number; plan?: string | null; planActive?: boolean };
    store.setItem(RUNS_KEY, String(Math.max(getRuns(), d.runs || 0)));
    if (d.planActive && d.plan) store.setItem(PLAN_KEY, d.plan);
  } catch {
    /* best-effort */
  }
}
