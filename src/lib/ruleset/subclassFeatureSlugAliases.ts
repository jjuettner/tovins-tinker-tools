/**
 * PHB24 class `data.subclasses[].index` (API 2024) vs `public.features.subclass_slug`
 * (seeded from feature JSON that still uses short 2014-style subclass indices).
 */
const SUBCLASS_CATALOG_SLUG_TO_FEATURE_SLUG: Readonly<Record<string, string>> = {
  "path-of-the-berserker": "berserker",
  "college-of-lore": "lore",
  "life-domain": "life",
  "circle-of-the-land": "land",
  "warrior-of-the-open-hand": "open-hand",
  "oath-of-devotion": "devotion",
  "draconic-sorcery": "draconic",
  "fiend-patron": "fiend"
};

/**
 * Subclass index values to test against `FeatureRow.subclass_slug` when unlocking features.
 *
 * @param catalogSubclassIndex Value stored on the character (ruleset subclass `index`).
 * @returns Non-empty list: the original slug plus the legacy feature slug when they differ.
 */
export function subclassSlugsForFeatureMatch(catalogSubclassIndex: string): readonly string[] {
  const t = catalogSubclassIndex.trim();
  if (!t) return [];
  const mapped = SUBCLASS_CATALOG_SLUG_TO_FEATURE_SLUG[t];
  if (mapped && mapped !== t) {
    return [t, mapped];
  }
  return [t];
}
