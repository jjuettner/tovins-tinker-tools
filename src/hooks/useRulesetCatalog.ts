import { useEffect, useMemo, useState } from "react";
import { subclassesFromClassData } from "@/lib/ruleset/classSubclasses";
import type { DndRace } from "@/lib/dndRaces";
import { raceSpeedFeetFromCatalogData } from "@/lib/dndRaces";
import type { DndClass, DndFeat, DndSpell } from "@/lib/dndData";
import type { DndEquipment } from "@/lib/dndEquipment";
import type { DndWeaponMastery } from "@/lib/dndWeaponMastery";
import {
  fetchClasses,
  fetchEquipment,
  fetchFeatures,
  fetchFeats,
  fetchRaces,
  fetchSpells,
  fetchWeaponMastery,
  type FeatureRow
} from "@/lib/db/rulesetCatalog";

export type RulesetCatalog = {
  loading: boolean;
  error: string | null;
  races: DndRace[];
  classes: DndClass[];
  spells: DndSpell[];
  feats: DndFeat[];
  equipment: DndEquipment[];
  weaponMasteries: DndWeaponMastery[];
  /** Raw `public.features` rows for active rulesets. */
  features: FeatureRow[];
  racesByIndex: Record<string, DndRace>;
  classesByIndex: Record<string, DndClass>;
  spellsByIndex: Record<string, DndSpell>;
  featsByIndex: Record<string, DndFeat>;
  equipmentByIndex: Record<string, DndEquipment>;
  weaponMasteryByIndex: Record<string, DndWeaponMastery>;
};

/**
 * Normalize spell-school name to a slug-style index (lowercase, hyphen-separated).
 *
 * @param s School display name from row data.
 * @returns Index string.
 */
function toDndSchoolIndex(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "-");
}

/**
 * Map race rows to client `DndRace` shapes sorted by name.
 *
 * @param rows Race rows from the database (`slug`, `name`, optional `data` for speed).
 * @returns Race list for UI.
 */
function transformRaces(rows: { slug: string; name: string; data?: unknown }[]) {
  return rows
    .map((r) => {
      const speed = raceSpeedFeetFromCatalogData(r.data);
      return {
        index: r.slug,
        name: r.name,
        ...(speed !== null ? { speed } : {})
      } satisfies DndRace;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Map class rows to client class shapes sorted by name.
 *
 * @param rows Class rows from the database (`data` holds `subclasses` array when seeded).
 * @returns Class list for UI.
 */
function transformClasses(rows: { slug: string; name: string; hit_die: number | null; data?: unknown }[]) {
  return rows
    .map((c) => ({
      index: c.slug,
      name: c.name,
      hit_die: typeof c.hit_die === "number" ? c.hit_die : 8,
      subclasses: subclassesFromClassData(c.data)
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Map feat rows to client feat shapes sorted by name.
 *
 * @param rows Feat rows from the database.
 * @returns Feat list for UI.
 */
function transformFeats(rows: { slug: string; name: string; feat_type: string | null; repeatable: string | null; description: string | null }[]) {
  return rows
    .map((f) => ({
      index: f.slug,
      name: f.name,
      description: f.description ?? undefined,
      type: f.feat_type ?? undefined,
      repeatable: f.repeatable ?? undefined
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Normalize JSON spell narrative fields to string arrays.
 *
 * @param value `desc` / `higher_level` from API or DB `data`.
 * @returns Paragraph list or undefined when empty.
 */
function normalizeSpellStringArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const parts = value.map((v) => (typeof v === "string" ? v.trim() : "")).filter(Boolean);
    return parts.length > 0 ? parts : undefined;
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }
  return undefined;
}

/**
 * Read spell body text from ruleset `data` jsonb (JSON arrays from seed data or importer prose).
 *
 * @param data Row `data` column.
 * @returns `desc` and `higher_level` compatible with `DndSpell`.
 */
function spellNarrativeFromData(data: unknown): { desc?: string[]; higher_level?: string[] } {
  if (!data || typeof data !== "object") {
    return {};
  }
  const d = data as Record<string, unknown>;
  const desc = normalizeSpellStringArray(d.desc);
  const higher = normalizeSpellStringArray(d.higher_level);
  if (desc !== undefined || higher !== undefined) {
    return { desc, higher_level: higher };
  }

  const prose = typeof d.description === "string" ? d.description.trim() : "";
  if (!prose) {
    return {};
  }
  const split = prose.split(/\n\s*At Higher Levels\.?\s*/i);
  const main = split[0]?.trim() ?? "";
  const hi = split.length > 1 ? split.slice(1).join("\n").trim() : "";
  return {
    desc: main ? [main] : undefined,
    higher_level: hi ? [hi] : undefined
  };
}

/**
 * Map spell rows to client spell shapes sorted by name.
 *
 * @param rows Spell rows from the database.
 * @returns Spell list for UI.
 */
function transformSpells(rows: Array<{
  slug: string;
  name: string;
  level: number;
  school: string | null;
  casting_time?: string | null;
  range_text?: string | null;
  duration?: string | null;
  concentration?: boolean | null;
  ritual?: boolean | null;
  classes?: string[] | null;
  data?: unknown;
}>) {
  return rows
    .map((sp) => {
      const school = sp.school
        ? {
            index: toDndSchoolIndex(sp.school),
            name: sp.school
          }
        : undefined;

      const classes = Array.isArray(sp.classes) ? sp.classes.filter(Boolean).map((idx) => ({ index: idx })) : undefined;
      const narrative = spellNarrativeFromData(sp.data);

      return {
        index: sp.slug,
        name: sp.name,
        level: sp.level,
        school,
        classes,
        casting_time: sp.casting_time ?? undefined,
        range: sp.range_text ?? undefined,
        duration: sp.duration ?? undefined,
        concentration: sp.concentration ?? undefined,
        ritual: sp.ritual ?? undefined,
        desc: narrative.desc,
        higher_level: narrative.higher_level
      } satisfies DndSpell;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Load ruleset catalog rows for active rulesets and expose derived index maps.
 *
 * @param rulesetIds Active ruleset ids.
 * @returns Catalog (loading/error + arrays + index maps).
 */
export function useRulesetCatalog(rulesetIds: string[]): Omit<
  RulesetCatalog,
  | "loading"
  | "error"
  | "racesByIndex"
  | "classesByIndex"
  | "spellsByIndex"
  | "featsByIndex"
  | "equipmentByIndex"
  | "weaponMasteryByIndex"
> & {
  loading: boolean;
  error: string | null;
  racesByIndex: Record<string, DndRace>;
  classesByIndex: Record<string, DndClass>;
  spellsByIndex: Record<string, DndSpell>;
  featsByIndex: Record<string, DndFeat>;
  equipmentByIndex: Record<string, DndEquipment>;
  weaponMasteryByIndex: Record<string, DndWeaponMastery>;
  features: FeatureRow[];
} {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [races, setRaces] = useState<DndRace[]>([]);
  const [classes, setClasses] = useState<DndClass[]>([]);
  const [spells, setSpells] = useState<DndSpell[]>([]);
  const [feats, setFeats] = useState<DndFeat[]>([]);
  const [equipment, setEquipment] = useState<DndEquipment[]>([]);
  const [weaponMasteries, setWeaponMasteries] = useState<DndWeaponMastery[]>([]);
  const [features, setFeatures] = useState<FeatureRow[]>([]);

  const key = useMemo(() => [...rulesetIds].sort().join(","), [rulesetIds]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        if (rulesetIds.length === 0) {
          if (!cancelled) {
            setRaces([]);
            setClasses([]);
            setSpells([]);
            setFeats([]);
            setEquipment([]);
            setWeaponMasteries([]);
            setFeatures([]);
          }
          return;
        }

        const [racesRows, classesRows, spellsRows, featsRows, equipmentRows, weaponMasteryRows, featureRows] = await Promise.all([
          fetchRaces(rulesetIds),
          fetchClasses(rulesetIds),
          fetchSpells(rulesetIds),
          fetchFeats(rulesetIds),
          fetchEquipment(rulesetIds),
          fetchWeaponMastery(rulesetIds),
          fetchFeatures(rulesetIds)
        ]);

        if (cancelled) return;

        const racesUi = transformRaces(racesRows.map((r) => ({ slug: r.slug, name: r.name, data: r.data })));
        const classesUi = transformClasses(
          classesRows.map((c) => ({ slug: c.slug, name: c.name, hit_die: c.hit_die, data: c.data }))
        );
        const featsUi = transformFeats(featsRows.map((f) => ({ slug: f.slug, name: f.name, feat_type: f.feat_type, repeatable: f.repeatable, description: f.description })));
        const spellsUi = transformSpells(
          spellsRows.map((s) => ({
            slug: s.slug,
            name: s.name,
            level: s.level,
            school: s.school ?? null,
            casting_time: s.casting_time ?? null,
            range_text: s.range_text ?? null,
            duration: s.duration ?? null,
            concentration: s.concentration ?? null,
            ritual: s.ritual ?? null,
            classes: s.classes ?? null,
            data: s.data
          }))
        );

        const equipmentUi = equipmentRows.map((eq) => {
          const data = (eq.data ?? {}) as Record<string, unknown>;
          return { ...(data as unknown as DndEquipment), index: eq.slug, name: eq.name } as DndEquipment;
        });

        const weaponMasteryUi = weaponMasteryRows
          .map((w) => ({
            index: w.slug,
            name: w.name,
            description: w.description ?? undefined
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        setRaces(racesUi);
        setClasses(classesUi);
        setSpells(spellsUi);
        setFeats(featsUi);
        setEquipment(equipmentUi);
        setWeaponMasteries(weaponMasteryUi);
        setFeatures(featureRows);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load ruleset catalog");
        setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [key, rulesetIds]);

  const racesByIndex = useMemo(() => Object.fromEntries(races.map((r) => [r.index, r])), [races]);
  const classesByIndex = useMemo(() => Object.fromEntries(classes.map((c) => [c.index, c])), [classes]);
  const spellsByIndex = useMemo(() => Object.fromEntries(spells.map((s) => [s.index, s])), [spells]);
  const featsByIndex = useMemo(() => Object.fromEntries(feats.map((f) => [f.index, f])), [feats]);
  const equipmentByIndex = useMemo(() => Object.fromEntries(equipment.map((e) => [e.index, e])), [equipment]);
  const weaponMasteryByIndex = useMemo(() => Object.fromEntries(weaponMasteries.map((m) => [m.index, m])), [weaponMasteries]);

  return {
    loading,
    error,
    races,
    classes,
    spells,
    feats,
    equipment,
    weaponMasteries,
    features,
    racesByIndex,
    classesByIndex,
    spellsByIndex,
    featsByIndex,
    equipmentByIndex,
    weaponMasteryByIndex
  } satisfies RulesetCatalog;
}
