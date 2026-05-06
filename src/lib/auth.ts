import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { requireSupabase } from "@/lib/supabase";

export type Profile = {
  id: string;
  display_name: string | null;
  is_admin: boolean;
};

/**
 * Subscribe to Supabase auth session changes.
 *
 * @returns Current session + loading state.
 */
export function useSession() {
  const sb = requireSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    sb.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setSession(null);
        setLoading(false);
      });

    const { data } = sb.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [sb]);

  return { session, loading } as const;
}

/**
 * Send a magic-link sign-in email.
 *
 * @param email User email.
 * @returns Nothing.
 */
export async function sendMagicLink(email: string) {
  const sb = requireSupabase();
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin + import.meta.env.BASE_URL
    }
  });
  if (error) throw error;
}

/**
 * Sign in with email/password.
 *
 * @param email User email.
 * @param password User password.
 * @returns Nothing.
 */
export async function signInWithPassword(email: string, password: string) {
  const sb = requireSupabase();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

/**
 * Sign up with email/password.
 *
 * @param email User email.
 * @param password User password.
 * @returns Nothing.
 */
export async function signUpWithPassword(email: string, password: string) {
  const sb = requireSupabase();
  const { error } = await sb.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin + import.meta.env.BASE_URL
    }
  });
  if (error) throw error;
}

/**
 * Request a password reset email.
 *
 * @param email User email.
 * @returns Nothing.
 */
export async function requestPasswordReset(email: string) {
  const sb = requireSupabase();
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + import.meta.env.BASE_URL + "reset-password"
  });
  if (error) throw error;
}

/**
 * Update current user's password.
 *
 * @param newPassword New password.
 * @returns Nothing.
 */
export async function updatePassword(newPassword: string) {
  const sb = requireSupabase();
  const { error } = await sb.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

/**
 * Sign out current user.
 *
 * @returns Nothing.
 */
export async function signOut() {
  const sb = requireSupabase();
  const { error } = await sb.auth.signOut();
  if (error) throw error;
}

/**
 * Load profile record for current session.
 *
 * @returns Profile + loading state.
 */
export function useProfile() {
  const sb = requireSupabase();
  const { session } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!session?.user?.id) {
        setProfile(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await sb
        .from("profiles")
        .select("id, display_name, is_admin")
        .eq("id", session.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setProfile(null);
        setLoading(false);
        return;
      }
      setProfile((data as Profile | null) ?? null);
      setLoading(false);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [sb, session?.user?.id]);

  return { profile, loading } as const;
}

