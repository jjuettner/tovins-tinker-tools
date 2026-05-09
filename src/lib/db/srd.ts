import { requireSupabase } from "@/lib/supabase";

export type RulesetScoped<T> = T & { ruleset_id: string; slug: string; name: string };

export type SpellRow = RulesetScoped<{
  level: number;
  school: string | null;
  casting_time: string | null;
  range_text: string | null;
  duration: string | null;
  concentration: boolean | null;
  ritual: boolean | null;
  classes: string[] | null;
  data: unknown;
}>;

export type ClassRow = RulesetScoped<{ hit_die: number | null; data: unknown }>;
export type RaceRow = RulesetScoped<{ data: unknown }>;
export type FeatRow = RulesetScoped<{ feat_type: string | null; repeatable: string | null; description: string | null; data: unknown }>;
export type EquipmentRow = RulesetScoped<{
  category: string | null;
  weapon_category: string | null;
  armor_category: string | null;
  cost: unknown;
  weight: number | null;
  data: unknown;
}>;

export type WeaponMasteryRow = RulesetScoped<{ description: string | null; data: unknown }>;

export type ConditionRow = {
  slug: string;
  name: string;
  description: string;
};

export type ClassSpellSlotsRow = {
  ruleset_id: string;
  class_slug: string;
  level: number;
  slots: unknown;
};

/**
 * Fetch rows from a table filtered by ruleset ids.
 *
 * @param table Table name.
 * @param rulesetIds Ruleset ids filter.
 * @param columns Columns selection (Supabase select string).
 * @returns Rows typed as `T`.
 */
async function fetchByRulesets<T>(table: string, rulesetIds: string[], columns = "*"): Promise<T[]> {
  const sb = requireSupabase();
  if (rulesetIds.length === 0) return [];
  const { data, error } = await sb.from(table).select(columns).in("ruleset_id", rulesetIds);
  if (error) throw error;
  return data as T[];
}

/**
 * Fetch spells scoped to the given rulesets.
 *
 * @param rulesetIds Ruleset ids.
 * @returns Spell rows.
 */
export function fetchSpells(rulesetIds: string[]) {
  return fetchByRulesets<SpellRow>("spells", rulesetIds);
}

/**
 * Fetch global condition definitions from `public.conditions` (public read).
 *
 * @returns Rows sorted by name (empty if table not seeded yet).
 */
export async function fetchConditions(): Promise<ConditionRow[]> {
  const sb = requireSupabase();
  const { data, error } = await sb.from("conditions").select("slug,name,description").order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ConditionRow[];
}

/**
 * Fetch classes scoped to the given rulesets.
 *
 * @param rulesetIds Ruleset ids.
 * @returns Class rows.
 */
export function fetchClasses(rulesetIds: string[]) {
  return fetchByRulesets<ClassRow>("classes", rulesetIds);
}

/**
 * Fetch races scoped to the given rulesets.
 *
 * @param rulesetIds Ruleset ids.
 * @returns Race rows.
 */
export function fetchRaces(rulesetIds: string[]) {
  return fetchByRulesets<RaceRow>("races", rulesetIds);
}

/**
 * Fetch feats scoped to the given rulesets.
 *
 * @param rulesetIds Ruleset ids.
 * @returns Feat rows.
 */
export function fetchFeats(rulesetIds: string[]) {
  return fetchByRulesets<FeatRow>("feats", rulesetIds);
}

/**
 * Fetch equipment scoped to the given rulesets.
 *
 * @param rulesetIds Ruleset ids.
 * @returns Equipment rows.
 */
export function fetchEquipment(rulesetIds: string[]) {
  return fetchByRulesets<EquipmentRow>("equipment", rulesetIds);
}

/**
 * Fetch weapon mastery properties scoped to the given rulesets.
 *
 * @param rulesetIds Ruleset ids.
 * @returns Weapon mastery rows.
 */
export function fetchWeaponMastery(rulesetIds: string[]) {
  return fetchByRulesets<WeaponMasteryRow>("weapon_mastery_properties", rulesetIds);
}

/**
 * Fetch class spell slot progressions scoped to the given rulesets.
 *
 * @param rulesetIds Ruleset ids.
 * @returns Class spell slot rows.
 */
export function fetchClassSpellSlots(rulesetIds: string[]) {
  return fetchByRulesets<ClassSpellSlotsRow>("class_spell_slots", rulesetIds);
}

