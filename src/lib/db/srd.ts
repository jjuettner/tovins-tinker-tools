import { requireSupabase } from "../supabase";

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

export type ClassSpellSlotsRow = {
  ruleset_id: string;
  class_slug: string;
  level: number;
  slots: unknown;
};

async function fetchByRulesets<T>(table: string, rulesetIds: string[], columns = "*"): Promise<T[]> {
  const sb = requireSupabase();
  if (rulesetIds.length === 0) return [];
  const { data, error } = await sb.from(table).select(columns).in("ruleset_id", rulesetIds);
  if (error) throw error;
  return data as T[];
}

export function fetchSpells(rulesetIds: string[]) {
  return fetchByRulesets<SpellRow>("spells", rulesetIds);
}
export function fetchClasses(rulesetIds: string[]) {
  return fetchByRulesets<ClassRow>("classes", rulesetIds);
}
export function fetchRaces(rulesetIds: string[]) {
  return fetchByRulesets<RaceRow>("races", rulesetIds);
}
export function fetchFeats(rulesetIds: string[]) {
  return fetchByRulesets<FeatRow>("feats", rulesetIds);
}
export function fetchEquipment(rulesetIds: string[]) {
  return fetchByRulesets<EquipmentRow>("equipment", rulesetIds);
}
export function fetchWeaponMastery(rulesetIds: string[]) {
  return fetchByRulesets<WeaponMasteryRow>("weapon_mastery_properties", rulesetIds);
}
export function fetchClassSpellSlots(rulesetIds: string[]) {
  return fetchByRulesets<ClassSpellSlotsRow>("class_spell_slots", rulesetIds);
}

