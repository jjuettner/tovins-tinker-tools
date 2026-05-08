import { requireSupabase } from "@/lib/supabase";

export type ProfileRow = {
  id: string;
  display_name: string | null;
  is_admin: boolean;
};

/**
 * Fetch profiles by id.
 *
 * @param ids Profile ids.
 * @returns Map of profile id -> profile row.
 */
export async function getProfilesByIds(ids: string[]): Promise<Map<string, ProfileRow>> {
  const unique = Array.from(new Set(ids.map((x) => x.trim()).filter(Boolean)));
  if (unique.length === 0) return new Map();
  const sb = requireSupabase();
  const { data, error } = await sb.from("profiles").select("id, display_name, is_admin").in("id", unique);
  if (error) throw error;
  const rows = (data ?? []) as ProfileRow[];
  return new Map(rows.map((r) => [r.id, r] as const));
}

