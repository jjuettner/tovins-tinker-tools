import { requireSupabase } from "@/lib/supabase";

export type Ruleset = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_builtin: boolean;
};

export const DND2024_RULESET_ID = "00000000-0000-4000-8000-00000000d202";

/**
 * List all rulesets available to current user.
 *
 * @returns Ruleset rows, sorted by name.
 */
export async function listRulesets(): Promise<Ruleset[]> {
  const sb = requireSupabase();
  const { data, error } = await sb.from("rulesets").select("id, slug, name, description, is_builtin").order("name");
  if (error) throw error;
  return data as Ruleset[];
}

