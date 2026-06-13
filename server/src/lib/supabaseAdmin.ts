// Server-side Supabase client using the service_role key (bypasses RLS).
// Verifies user JWTs and reads/writes the authoritative usage/entitlement rows.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let admin: SupabaseClient | null = null;
export function getAdmin(): SupabaseClient | null {
  if (!url || !serviceKey) return null;
  if (!admin) admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}

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

/** Extract the bearer token from an Authorization header value. */
export function bearerFromHeader(authHeader?: string | null): string | null {
  if (!authHeader) return null;
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}
