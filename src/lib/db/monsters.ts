import { requireSupabase } from "@/lib/supabase";

export type MonsterRow = {
  id: string;
  source_index: number;
  name: string;
  cr: number;
  xp: number;
  hp: number;
  hp_dice: string | null;
  ac: string | null;
  meta: string | null;
  img_url: string | null;
  str: number | null;
  dex: number | null;
  con: number | null;
  int: number | null;
  wis: number | null;
  cha: number | null;
  str_mod: number | null;
  dex_mod: number | null;
  con_mod: number | null;
  int_mod: number | null;
  wis_mod: number | null;
  cha_mod: number | null;
  saving_throws: string | null;
  skills: string | null;
  traits_html: string | null;
  actions_html: string | null;
  legendary_html: string | null;
  created_at: string;
};

export type MonsterSort = "name" | "cr";

/**
 * List monsters with optional name search and sort.
 *
 * @param opts.search Substring match on name (case-insensitive).
 * @param opts.sort Sort column.
 * @param opts.asc Sort direction.
 * @returns Rows (capped at 500 for UI).
 */
export async function listMonsters(opts: {
  search?: string;
  sort: MonsterSort;
  asc: boolean;
}): Promise<MonsterRow[]> {
  const sb = requireSupabase();
  let q = sb.from("monsters").select("*");

  const term = opts.search?.trim();
  if (term) {
    q = q.ilike("name", `%${term}%`);
  }

  q = q.order(opts.sort, { ascending: opts.asc, nullsFirst: false }).limit(500);

  const { data, error } = await q;
  if (error) throw error;
  return (data as MonsterRow[]) ?? [];
}

/**
 * Load one monster by id.
 *
 * @param id Monster uuid.
 * @returns Row or null.
 */
export async function getMonsterById(id: string): Promise<MonsterRow | null> {
  const sb = requireSupabase();
  const { data, error } = await sb.from("monsters").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as MonsterRow | null) ?? null;
}

/**
 * Load many monsters by id (for CR totals / labels).
 *
 * @param ids Monster uuids.
 * @returns Map id -> row.
 */
export async function getMonstersByIds(ids: string[]): Promise<Map<string, MonsterRow>> {
  const uniq = [...new Set(ids.filter(Boolean))];
  const out = new Map<string, MonsterRow>();
  if (uniq.length === 0) return out;

  const sb = requireSupabase();
  const { data, error } = await sb.from("monsters").select("*").in("id", uniq);
  if (error) throw error;
  for (const row of (data as MonsterRow[]) ?? []) {
    out.set(row.id, row);
  }
  return out;
}
