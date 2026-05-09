import type { FeatureRow } from "@/lib/db/rulesetCatalog";
import { selectUnlockedClassFeatures } from "@/lib/ruleset/classFeatures";
import type { Character } from "@/types/character";

/** Display row for passive sheet content (ruleset features today; buffs later). */
export type SheetPassiveEntry =
  | {
      kind: "ruleset-class-feature";
      scope: "base" | "subclass";
      slug: string;
      name: string;
      level: number;
      description: string;
      /** From seeded feature JSON `subclass.name` when `scope` is `subclass`. */
      subclassPathName: string | null;
    };

function descriptionFromFeatureData(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const desc = (data as Record<string, unknown>).desc;
  if (!Array.isArray(desc)) return "";
  const parts = desc.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean);
  return parts.join("\n\n");
}

function subclassDisplayNameFromFeatureData(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const sub = (data as Record<string, unknown>).subclass;
  if (!sub || typeof sub !== "object") return null;
  const name = (sub as Record<string, unknown>).name;
  return typeof name === "string" && name.trim() ? name.trim() : null;
}

/**
 * Build passive sheet entries for General tab: unlocked ruleset class features.
 * Future: merge buff-derived entries here.
 *
 * @param c Character (class / subclass / level).
 * @param featureRows Raw `features` rows from the active ruleset catalog.
 * @returns Single list sorted by level, then base class before subclass at the same level, then name.
 */
export function buildSheetPassiveEntries(c: Character, featureRows: FeatureRow[]): SheetPassiveEntry[] {
  const { base, subclass } = selectUnlockedClassFeatures(featureRows, {
    classSlug: c.classIndex,
    subclassSlug: c.subclassIndex,
    level: c.level
  });

  const toEntry = (scope: "base" | "subclass", row: FeatureRow): SheetPassiveEntry | null => {
    const lv = row.level;
    if (typeof lv !== "number" || !Number.isFinite(lv)) return null;
    return {
      kind: "ruleset-class-feature",
      scope,
      slug: row.slug,
      name: row.name,
      level: lv,
      description: descriptionFromFeatureData(row.data),
      subclassPathName: scope === "subclass" ? subclassDisplayNameFromFeatureData(row.data) : null
    };
  };

  const out: SheetPassiveEntry[] = [];
  for (const row of base) {
    const e = toEntry("base", row);
    if (e) out.push(e);
  }
  for (const row of subclass) {
    const e = toEntry("subclass", row);
    if (e) out.push(e);
  }

  const scopeOrder = (s: SheetPassiveEntry["scope"]) => (s === "base" ? 0 : 1);
  out.sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    const so = scopeOrder(a.scope) - scopeOrder(b.scope);
    if (so !== 0) return so;
    return a.name.localeCompare(b.name);
  });

  return out;
}
