import { requireSupabase } from "@/lib/supabase";

/**
 * Update the current user's display name (`profiles.display_name`).
 *
 * @param displayName New display name (null clears).
 * @returns Nothing.
 */
export async function updateMyDisplayName(displayName: string | null): Promise<void> {
  const sb = requireSupabase();
  const { data: userData, error: userError } = await sb.auth.getUser();
  if (userError) throw userError;
  const uid = userData.user?.id;
  if (!uid) throw new Error("Not signed in");

  const { error } = await sb.from("profiles").update({ display_name: displayName }).eq("id", uid);
  if (error) throw error;
}

