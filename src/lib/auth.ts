import { useAuth } from "@/lib/AuthProvider";
import { requireSupabase } from "@/lib/supabase";

export type { Profile } from "@/lib/AuthProvider";

/**
 * Subscribe to Supabase auth session changes (shared via `AuthProvider`).
 *
 * @returns Current session + loading state.
 */
export function useSession() {
  const { session, sessionLoading } = useAuth();
  return { session, loading: sessionLoading } as const;
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
 * Load profile record for current session (shared via `AuthProvider`).
 *
 * @returns Profile + loading state.
 */
export function useProfile() {
  const { profile, profileLoading } = useAuth();
  return { profile, loading: profileLoading } as const;
}
