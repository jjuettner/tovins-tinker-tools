import type { FeatureRow } from "@/lib/db/rulesetCatalog";
import { subclassSlugsForFeatureMatch } from "@/lib/ruleset/subclassFeatureSlugAliases";

/** Base vs subclass-scoped rows from the ruleset `features` table. */
export type UnlockedClassFeatures = {
  base: FeatureRow[];
  subclass: FeatureRow[];
};

function trimSlug(s: string | null | undefined): string {
  return typeof s === "string" ? s.trim() : "";
}

function subclassColumnEmpty(subclassSlug: string | null | undefined): boolean {
  return subclassSlug == null || trimSlug(subclassSlug) === "";
}

/**
 * Whether the feature JSON `data` has a `parent` (sub-choice row, e.g. a specific fighting style).
 *
 * @param data Row `data` column from `public.features`.
 * @returns True when `parent.index` is a non-empty string.
 */
export function featureRowHasParent(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const parent = (data as Record<string, unknown>).parent;
  if (!parent || typeof parent !== "object") return false;
  const idx = (parent as Record<string, unknown>).index;
  return typeof idx === "string" && idx.trim().length > 0;
}

function sortByLevelThenName(a: FeatureRow, b: FeatureRow): number {
  const la = typeof a.level === "number" ? a.level : 999;
  const lb = typeof b.level === "number" ? b.level : 999;
  if (la !== lb) return la - lb;
  return a.name.localeCompare(b.name);
}

/**
 * Unlocked class and subclass feature rows for a character, from ruleset catalog rows.
 *
 * @param rows Feature rows from Supabase (may span multiple rulesets).
 * @param opts.classSlug Ruleset class slug (same as character `classIndex`).
 * @param opts.subclassSlug Optional subclass slug (same as character `subclassIndex`).
 * @param opts.level Character level used as maximum feature `level`.
 * @returns Base-class rows and subclass-scoped rows, sorted by level then name.
 */
export function selectUnlockedClassFeatures(
  rows: FeatureRow[],
  opts: { classSlug: string; subclassSlug: string | null | undefined; level: number }
): UnlockedClassFeatures {
  const classSlug = trimSlug(opts.classSlug);
  const subclassSlug = trimSlug(opts.subclassSlug ?? "");
  const subclassMatchSlugs = subclassSlug ? subclassSlugsForFeatureMatch(subclassSlug) : [];
  const characterLevel = Math.floor(opts.level);
  if (!classSlug || !Number.isFinite(characterLevel) || characterLevel < 1) {
    return { base: [], subclass: [] };
  }

  const base: FeatureRow[] = [];
  const subclass: FeatureRow[] = [];

  for (const row of rows) {
    if (trimSlug(row.class_slug) !== classSlug) continue;
    const rowLevel = row.level;
    if (typeof rowLevel !== "number" || !Number.isFinite(rowLevel) || rowLevel > characterLevel) continue;
    if (featureRowHasParent(row.data)) continue;

    if (subclassColumnEmpty(row.subclass_slug)) {
      base.push(row);
    } else if (subclassSlug && subclassMatchSlugs.includes(trimSlug(row.subclass_slug))) {
      subclass.push(row);
    }
  }

  base.sort(sortByLevelThenName);
  subclass.sort(sortByLevelThenName);

  return { base, subclass };
}
