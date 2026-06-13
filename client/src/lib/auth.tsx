
import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase, supabaseEnabled, accessToken } from "./supabase";

export interface AuthUser {
  id: string;
  email: string | null;
  avatar: string | null;
  name: string | null;
}

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  enabled: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  token: () => Promise<string | null>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  enabled: false,
  signIn: async () => {},
  logout: async () => {},
  token: async () => null,
});

function normalize(u: User | null | undefined): AuthUser | null {
  if (!u) return null;
  const m = u.user_metadata || {};
  return {
    id: u.id,
    email: u.email ?? null,
    avatar: (m.avatar_url as string) || (m.picture as string) || null,
    name: (m.full_name as string) || (m.name as string) || null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }
    sb.auth.getSession().then(({ data }) => {
      setUser(normalize(data.session?.user));
      setLoading(false);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      setUser(normalize(session?.user));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    const sb = getSupabase();
    if (!sb) return;
    await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: typeof window !== "undefined" ? `${window.location.origin}/app` : undefined },
    });
  };

  const logout = async () => {
    await getSupabase()?.auth.signOut();
  };

  return (
    <Ctx.Provider value={{ user, loading, enabled: supabaseEnabled, signIn, logout, token: accessToken }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
