// Authoritative, server-side entitlement backed by Supabase (public.usage).
// The client gate (localStorage) is UX only; THIS allows/blocks a generation when
// the service-role key is configured.
import { getAdmin, adminReady, verifyUid } from "./supabaseAdmin";
import { FREE_RUNS, tierById } from "./pricing";

export interface Entitlement {
  enforced: boolean; // false when Supabase admin isn't configured → caller falls back to open access
  uid: string | null;
  allowed: boolean;
  reason: "ok" | "free" | "plan" | "quota_exceeded" | "anonymous";
}

/** Decide whether this request (given its bearer token) may run a generation. */
export async function checkEntitlement(token: string | null): Promise<Entitlement> {
  if (!adminReady()) return { enforced: false, uid: null, allowed: true, reason: "ok" };

  const uid = await verifyUid(token);
  if (!uid) {
    // Signed-out / bad token. Anonymous quota isn't server-verifiable; allow here and
    // let the client gate handle the single free try.
    return { enforced: true, uid: null, allowed: true, reason: "anonymous" };
  }

  const { data } = await getAdmin()!
    .from("usage")
    .select("runs, plan_active")
    .eq("user_id", uid)
    .maybeSingle();

  if (data?.plan_active) return { enforced: true, uid, allowed: true, reason: "plan" };
  if ((data?.runs || 0) < FREE_RUNS) return { enforced: true, uid, allowed: true, reason: "free" };
  return { enforced: true, uid, allowed: false, reason: "quota_exceeded" };
}

/** Count a completed run against the free quota (signed-in users only). Atomic via RPC. */
export async function recordRunServer(uid: string | null) {
  if (!uid || !adminReady()) return;
  try {
    await getAdmin()!.rpc("increment_runs", { p_uid: uid });
  } catch {
    /* best-effort */
  }
}

/** Activate a paid plan for a user (only after verified payment). */
export async function activatePlanServer(uid: string, tierId: string) {
  if (!adminReady()) return;
  const tier = tierById(tierId);
  await getAdmin()!
    .from("usage")
    .upsert(
      {
        user_id: uid,
        plan: tierId,
        plan_active: true,
        plan_price: tier?.price ?? null,
        plan_at: Date.now(),
        updated_at: Date.now(),
      },
      { onConflict: "user_id" }
    );
}
