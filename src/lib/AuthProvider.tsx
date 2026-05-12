import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { requireSupabase } from "@/lib/supabase";

export type Profile = {
  id: string;
  display_name: string | null;
  is_admin: boolean;
};

type AuthContextValue = {
  session: Session | null;
  sessionLoading: boolean;
  profile: Profile | null;
  profileLoading: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Coerce `profiles.is_admin` from PostgREST / drivers that may not use strict booleans.
 */
function parseIsAdmin(value: unknown): boolean {
  return value === true || value === 1 || value === "true" || value === "t";
}

function mapProfileRow(data: unknown): Profile | null {
  if (!data || typeof data !== "object") return null;
  // PostgREST row shape; keys not validated beyond id + flags.
  const row = data as Record<string, unknown>;
  if (typeof row.id !== "string") return null;
  const dn = row.display_name;
  return {
    id: row.id,
    display_name: typeof dn === "string" ? dn : null,
    is_admin: parseIsAdmin(row.is_admin)
  };
}

/**
 * Single Supabase auth session + `profiles` row for the whole app tree.
 */
export function AuthProvider(props: { children: ReactNode }) {
  const sb = requireSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  /** Bumped on sign-in/out and user updates so we refetch `profiles` even when `user.id` is unchanged. */
  const [profileFetchNonce, setProfileFetchNonce] = useState(0);

  useEffect(() => {
    let mounted = true;
    sb.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session ?? null);
        setSessionLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setSession(null);
        setSessionLoading(false);
      });

    const { data } = sb.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setSessionLoading(false);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        setProfile(null);
        setProfileFetchNonce((n) => n + 1);
        if (event === "SIGNED_OUT") {
          setProfileLoading(false);
        } else {
          setProfileLoading(true);
        }
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [sb]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const uid = session?.user?.id;
      if (!uid) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }
      setProfileLoading(true);
      const { data, error } = await sb.from("profiles").select("id, display_name, is_admin").eq("id", uid).maybeSingle();
      if (cancelled) return;
      if (error) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }
      setProfile(mapProfileRow(data));
      setProfileLoading(false);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [sb, session?.user?.id, profileFetchNonce]);

  const value = useMemo(
    () => ({
      session,
      sessionLoading,
      profile,
      profileLoading
    }),
    [session, sessionLoading, profile, profileLoading]
  );

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}

/**
 * Access shared auth + profile state (must be inside `AuthProvider`).
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
