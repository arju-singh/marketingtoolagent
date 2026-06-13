"use client";

// Client-side entitlement is OPTIMISTIC UX only. The server (/api/generate*) is authoritative
// when Supabase is configured — it reads/increments runs and activates a plan only via the
// verified-payment route. The client never writes the authoritative plan.
import { getSupabase } from "./supabase";
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
  const sb = getSupabase();
  const store = ls();
  if (!sb || !store) return;
  const { data, error } = await sb
    .from("usage")
    .select("runs, plan, plan_active")
    .eq("user_id", uid)
    .maybeSingle();
  if (error || !data) return;
  store.setItem(RUNS_KEY, String(Math.max(getRuns(), data.runs || 0)));
  if (data.plan_active && data.plan) store.setItem(PLAN_KEY, data.plan);
}
