import "server-only";

// Server-side Supabase client using the service_role key (bypasses RLS).
// Used to verify user JWTs and read/write the authoritative usage/entitlement rows.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let admin: SupabaseClient | null = null;
export function getAdmin(): SupabaseClient | null {
  if (!url || !serviceKey) return null;
  if (!admin) admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}

/** True when the server has a service-role client (i.e. enforcement is possible). */
export function adminReady(): boolean {
  return getAdmin() !== null;
}

/** Validate a Supabase access token and return the user id (uuid), or null. */
export async function verifyUid(token: string | null): Promise<string | null> {
  const a = getAdmin();
  if (!a || !token) return null;
  const { data, error } = await a.auth.getUser(token);
  return error ? null : data.user?.id ?? null;
}

export function bearer(req: Request): string | null {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}
