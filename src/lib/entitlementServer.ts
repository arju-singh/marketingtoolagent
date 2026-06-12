import "server-only";

// Authoritative, server-side entitlement. The client gate (localStorage) is UX only;
// THIS is what actually allows or blocks a generation when Firebase Admin is configured.
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb, adminReady } from "./firebaseAdmin";
import { FREE_RUNS, tierById } from "./pricing";

export interface Entitlement {
  enforced: boolean; // false when admin isn't configured → caller falls back to open access
  uid: string | null;
  allowed: boolean;
  reason: "ok" | "free" | "plan" | "quota_exceeded" | "anonymous";
}

function bearer(req: Request): string | null {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

async function verifyUid(req: Request): Promise<string | null> {
  const token = bearer(req);
  const auth = getAdminAuth();
  if (!token || !auth) return null;
  try {
    const decoded = await auth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

const usageRef = (uid: string) => getAdminDb()!.doc(`users/${uid}/meta/usage`);

/** Decide whether this request may run a generation. */
export async function checkEntitlement(req: Request): Promise<Entitlement> {
  // Admin not configured → we can't enforce. Let it through; client gate still applies.
  if (!adminReady()) return { enforced: false, uid: null, allowed: true, reason: "ok" };

  const uid = await verifyUid(req);
  if (!uid) {
    // Signed-out (or bad token). Allow exactly the free quota anonymously is not verifiable,
    // so treat anonymous as a single free try handled by the client gate, and allow here.
    return { enforced: true, uid: null, allowed: true, reason: "anonymous" };
  }

  const snap = await usageRef(uid).get();
  const data = (snap.exists ? snap.data() : {}) as { runs?: number; planActive?: boolean };
  if (data.planActive) return { enforced: true, uid, allowed: true, reason: "plan" };
  if ((data.runs || 0) < FREE_RUNS) return { enforced: true, uid, allowed: true, reason: "free" };
  return { enforced: true, uid, allowed: false, reason: "quota_exceeded" };
}

/** Count a completed run against the user's free quota (signed-in users only). */
export async function recordRunServer(uid: string | null) {
  if (!uid || !adminReady()) return;
  try {
    await usageRef(uid).set({ runs: FieldValue.increment(1), updatedAt: Date.now() }, { merge: true });
  } catch {
    /* best-effort */
  }
}

/** Activate a paid plan for a user (called only after verified payment). */
export async function activatePlanServer(uid: string, tierId: string) {
  if (!adminReady()) return;
  const tier = tierById(tierId);
  await usageRef(uid).set(
    { plan: tierId, planActive: true, planPrice: tier?.price || null, planAt: Date.now() },
    { merge: true }
  );
}
