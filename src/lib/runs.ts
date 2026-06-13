"use client";

// Per-user run history in Postgres (public.runs), via the Supabase Data API.
// RLS scopes every query to the signed-in user. No-ops when Supabase isn't configured.
import { getSupabase } from "./supabase";
import type { ProductContext, Deliverable } from "./types";

export interface SavedRun {
  id: string;
  productName: string;
  oneLiner: string;
  createdAt: number;
  context: ProductContext;
  deliverables: Deliverable[];
}

interface RunRow {
  id: string;
  product_name: string | null;
  one_liner: string | null;
  created_at: number | null;
  context: ProductContext;
  deliverables: Deliverable[];
}

const toSaved = (r: RunRow): SavedRun => ({
  id: r.id,
  productName: r.product_name || "Untitled",
  oneLiner: r.one_liner || "",
  createdAt: r.created_at || 0,
  context: r.context,
  deliverables: r.deliverables || [],
});

export async function saveRun(
  uid: string,
  context: ProductContext,
  deliverables: Deliverable[]
): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const id = `${Date.now()}-${Math.floor(Math.random() * 1e6).toString(36)}`;
  const { error } = await sb.from("runs").insert({
    id,
    user_id: uid,
    product_name: context.summary.productName,
    one_liner: context.summary.oneLiner,
    created_at: Date.now(),
    context,
    deliverables,
  });
  return error ? null : id;
}

export async function listRuns(uid: string): Promise<SavedRun[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("runs")
    .select("*")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });
  return error || !data ? [] : (data as RunRow[]).map(toSaved);
}

export async function getRun(uid: string, id: string): Promise<SavedRun | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from("runs").select("*").eq("user_id", uid).eq("id", id).maybeSingle();
  return error || !data ? null : toSaved(data as RunRow);
}
