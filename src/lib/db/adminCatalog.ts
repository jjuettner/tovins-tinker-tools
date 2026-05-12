import { requireSupabase } from "@/lib/supabase";
import type { FeatRow, FeatureRow, SpellRow } from "@/lib/db/rulesetCatalog";

export type AdminFeatRow = FeatRow & { id: string; created_at: string; updated_at: string };
export type AdminFeatureRow = FeatureRow & { id: string; created_at: string; updated_at: string };
export type AdminSpellRow = SpellRow & { id: string; created_at: string; updated_at: string };

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Parse optional JSON object for `data` columns; empty string becomes `{}`.
 *
 * @param raw Textarea contents.
 * @param label Field label for error messages.
 * @returns Parsed JSON value.
 * @throws If non-empty and invalid JSON.
 */
export function parseDataJson(raw: string, label: string): unknown {
  const t = raw.trim();
  if (!t) return {};
  try {
    // JSON.parse is typed as any; narrow to unknown for callers.
    return JSON.parse(t) as unknown;
  } catch {
    throw new Error(`${label}: invalid JSON`);
  }
}

/**
 * Serialize class slugs from a comma-separated input line.
 *
 * @param raw User text (e.g. `wizard, fighter`).
 * @returns Slug array or null when empty.
 */
export function parseClassesCsv(raw: string): string[] | null {
  const parts = raw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : null;
}

/**
 * Join spell class slugs for a text field.
 *
 * @param classes DB array or null.
 * @returns Comma-separated string.
 */
export function formatClassesCsv(classes: string[] | null | undefined): string {
  return (classes ?? []).join(", ");
}

/**
 * Load every feat row (admin write policy; list is public read anyway).
 *
 * @returns All rows, name order.
 */
export async function listAllAdminFeats(): Promise<AdminFeatRow[]> {
  const sb = requireSupabase();
  const { data, error } = await sb.from("feats").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as AdminFeatRow[];
}

/**
 * Load every class/feature row from `public.features`.
 *
 * @returns All rows, name order.
 */
export async function listAllAdminFeatures(): Promise<AdminFeatureRow[]> {
  const sb = requireSupabase();
  const { data, error } = await sb.from("features").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as AdminFeatureRow[];
}

/**
 * Load every spell row.
 *
 * @returns All rows, name order.
 */
export async function listAllAdminSpells(): Promise<AdminSpellRow[]> {
  const sb = requireSupabase();
  const { data, error } = await sb.from("spells").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as AdminSpellRow[];
}

export type FeatInsertInput = {
  ruleset_id: string;
  slug: string;
  name: string;
  feat_type?: string | null;
  repeatable?: string | null;
  description?: string | null;
  summary?: string | null;
  data: unknown;
};

/**
 * Insert a feat row.
 *
 * @param row Payload without id/timestamps.
 * @returns Inserted row.
 */
export async function insertAdminFeat(row: FeatInsertInput): Promise<AdminFeatRow> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("feats")
    .insert({
      ruleset_id: row.ruleset_id,
      slug: row.slug.trim(),
      name: row.name.trim(),
      feat_type: row.feat_type?.trim() || null,
      repeatable: row.repeatable?.trim() || null,
      description: row.description?.trim() || null,
      summary: row.summary?.trim() || null,
      data: row.data
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as AdminFeatRow;
}

/**
 * Update a feat by primary key.
 *
 * @param id Row id.
 * @param patch Fields to merge (timestamps handled here).
 */
export async function updateAdminFeat(id: string, patch: Partial<FeatInsertInput>): Promise<void> {
  const sb = requireSupabase();
  const body: Record<string, unknown> = { updated_at: nowIso() };
  if (patch.ruleset_id !== undefined) body.ruleset_id = patch.ruleset_id;
  if (patch.slug !== undefined) body.slug = patch.slug.trim();
  if (patch.name !== undefined) body.name = patch.name.trim();
  if (patch.feat_type !== undefined) body.feat_type = patch.feat_type?.trim() || null;
  if (patch.repeatable !== undefined) body.repeatable = patch.repeatable?.trim() || null;
  if (patch.description !== undefined) body.description = patch.description?.trim() || null;
  if (patch.summary !== undefined) body.summary = patch.summary?.trim() || null;
  if (patch.data !== undefined) body.data = patch.data;
  const { error } = await sb.from("feats").update(body).eq("id", id);
  if (error) throw error;
}

export type FeatureInsertInput = {
  ruleset_id: string;
  slug: string;
  name: string;
  class_slug?: string | null;
  subclass_slug?: string | null;
  level?: number | null;
  summary?: string | null;
  data: unknown;
};

/**
 * Insert a feature row.
 *
 * @param row Payload without id/timestamps.
 * @returns Inserted row.
 */
export async function insertAdminFeature(row: FeatureInsertInput): Promise<AdminFeatureRow> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("features")
    .insert({
      ruleset_id: row.ruleset_id,
      slug: row.slug.trim(),
      name: row.name.trim(),
      class_slug: row.class_slug?.trim() || null,
      subclass_slug: row.subclass_slug?.trim() || null,
      level: row.level ?? null,
      summary: row.summary?.trim() || null,
      data: row.data
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as AdminFeatureRow;
}

/**
 * Update a feature row.
 *
 * @param id Row id.
 * @param patch Fields to merge.
 */
export async function updateAdminFeature(id: string, patch: Partial<FeatureInsertInput>): Promise<void> {
  const sb = requireSupabase();
  const body: Record<string, unknown> = { updated_at: nowIso() };
  if (patch.ruleset_id !== undefined) body.ruleset_id = patch.ruleset_id;
  if (patch.slug !== undefined) body.slug = patch.slug.trim();
  if (patch.name !== undefined) body.name = patch.name.trim();
  if (patch.class_slug !== undefined) body.class_slug = patch.class_slug?.trim() || null;
  if (patch.subclass_slug !== undefined) body.subclass_slug = patch.subclass_slug?.trim() || null;
  if (patch.level !== undefined) body.level = patch.level;
  if (patch.summary !== undefined) body.summary = patch.summary?.trim() || null;
  if (patch.data !== undefined) body.data = patch.data;
  const { error } = await sb.from("features").update(body).eq("id", id);
  if (error) throw error;
}

export type SpellInsertInput = {
  ruleset_id: string;
  slug: string;
  name: string;
  level: number;
  school?: string | null;
  casting_time?: string | null;
  range_text?: string | null;
  duration?: string | null;
  concentration?: boolean | null;
  ritual?: boolean | null;
  classes?: string[] | null;
  summary?: string | null;
  data: unknown;
};

/**
 * Insert a spell row.
 *
 * @param row Payload without id/timestamps.
 * @returns Inserted row.
 */
export async function insertAdminSpell(row: SpellInsertInput): Promise<AdminSpellRow> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("spells")
    .insert({
      ruleset_id: row.ruleset_id,
      slug: row.slug.trim(),
      name: row.name.trim(),
      level: Math.floor(row.level),
      school: row.school?.trim() || null,
      casting_time: row.casting_time?.trim() || null,
      range_text: row.range_text?.trim() || null,
      duration: row.duration?.trim() || null,
      concentration: row.concentration ?? null,
      ritual: row.ritual ?? null,
      classes: row.classes ?? null,
      summary: row.summary?.trim() || null,
      data: row.data
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as AdminSpellRow;
}

/**
 * Update a spell row.
 *
 * @param id Row id.
 * @param patch Fields to merge.
 */
export async function updateAdminSpell(id: string, patch: Partial<SpellInsertInput>): Promise<void> {
  const sb = requireSupabase();
  const body: Record<string, unknown> = { updated_at: nowIso() };
  if (patch.ruleset_id !== undefined) body.ruleset_id = patch.ruleset_id;
  if (patch.slug !== undefined) body.slug = patch.slug.trim();
  if (patch.name !== undefined) body.name = patch.name.trim();
  if (patch.level !== undefined) body.level = Math.floor(patch.level);
  if (patch.school !== undefined) body.school = patch.school?.trim() || null;
  if (patch.casting_time !== undefined) body.casting_time = patch.casting_time?.trim() || null;
  if (patch.range_text !== undefined) body.range_text = patch.range_text?.trim() || null;
  if (patch.duration !== undefined) body.duration = patch.duration?.trim() || null;
  if (patch.concentration !== undefined) body.concentration = patch.concentration;
  if (patch.ritual !== undefined) body.ritual = patch.ritual;
  if (patch.classes !== undefined) body.classes = patch.classes;
  if (patch.summary !== undefined) body.summary = patch.summary?.trim() || null;
  if (patch.data !== undefined) body.data = patch.data;
  const { error } = await sb.from("spells").update(body).eq("id", id);
  if (error) throw error;
}
