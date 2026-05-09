import { useEffect, useMemo, useState } from "react";
import type { DndClass, DndFeat, DndSpell } from "@/lib/dndData";
import type { DndEquipment } from "@/lib/dndEquipment";
import type { DndRace } from "@/lib/dndRaces";
import type { DndWeaponMastery } from "@/lib/dndWeaponMastery";
import { fetchClasses, fetchEquipment, fetchFeats, fetchRaces, fetchSpells, fetchWeaponMastery } from "@/lib/db/srd";

export type RulesetSrdCatalog = {
  loading: boolean;
  error: string | null;
  races: DndRace[];
  classes: DndClass[];
  spells: DndSpell[];
  feats: DndFeat[];
  equipment: DndEquipment[];
  weaponMasteries: DndWeaponMastery[];
  racesByIndex: Record<string, DndRace>;
  classesByIndex: Record<string, DndClass>;
  spellsByIndex: Record<string, DndSpell>;
  featsByIndex: Record<string, DndFeat>;
  equipmentByIndex: Record<string, DndEquipment>;
  weaponMasteryByIndex: Record<string, DndWeaponMastery>;
};

/**
 * Normalize spell-school name to an SRD-ish index.
 *
 * @param s School name.
 * @returns Index string.
 */
function toDndSchoolIndex(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "-");
}

/**
 * Transform race rows into SRD race objects sorted by name.
 *
 * @param rows Race rows.
 * @returns SRD races.
 */
function transformRaces(rows: { slug: string; name: string }[]) {
  return rows
    .map((r) => ({ index: r.slug, name: r.name } satisfies DndRace))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Transform class rows into SRD class objects sorted by name.
 *
 * @param rows Class rows.
 * @returns SRD classes.
 */
function transformClasses(rows: { slug: string; name: string; hit_die: number | null }[]) {
  return rows
    .map((c) => ({
      index: c.slug,
      name: c.name,
      hit_die: typeof c.hit_die === "number" ? c.hit_die : 8
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Transform feat rows into SRD feat objects sorted by name.
 *
 * @param rows Feat rows.
 * @returns SRD feats.
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
 * Read spell body text from ruleset `data` jsonb (SRD arrays or importer prose).
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
 * Transform spell rows into SRD spell objects sorted by name.
 *
 * @param rows Spell rows.
 * @returns SRD spells.
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
 * Load SRD catalog rows for the given rulesets and expose derived index maps.
 *
 * @param rulesetIds Active ruleset ids.
 * @returns Catalog (loading/error + arrays + index maps).
 */
export function useRulesetSrdCatalog(rulesetIds: string[]): Omit<RulesetSrdCatalog, "loading" | "error" | "racesByIndex" | "classesByIndex" | "spellsByIndex" | "featsByIndex" | "equipmentByIndex" | "weaponMasteryByIndex"> & {
  loading: boolean;
  error: string | null;
  racesByIndex: Record<string, DndRace>;
  classesByIndex: Record<string, DndClass>;
  spellsByIndex: Record<string, DndSpell>;
  featsByIndex: Record<string, DndFeat>;
  equipmentByIndex: Record<string, DndEquipment>;
  weaponMasteryByIndex: Record<string, DndWeaponMastery>;
} {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [races, setRaces] = useState<DndRace[]>([]);
  const [classes, setClasses] = useState<DndClass[]>([]);
  const [spells, setSpells] = useState<DndSpell[]>([]);
  const [feats, setFeats] = useState<DndFeat[]>([]);
  const [equipment, setEquipment] = useState<DndEquipment[]>([]);
  const [weaponMasteries, setWeaponMasteries] = useState<DndWeaponMastery[]>([]);

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
          }
          return;
        }

        const [racesRows, classesRows, spellsRows, featsRows, equipmentRows, weaponMasteryRows] = await Promise.all([
          fetchRaces(rulesetIds),
          fetchClasses(rulesetIds),
          fetchSpells(rulesetIds),
          fetchFeats(rulesetIds),
          fetchEquipment(rulesetIds),
          fetchWeaponMastery(rulesetIds)
        ]);

        if (cancelled) return;

        const racesUi = transformRaces(racesRows.map((r) => ({ slug: r.slug, name: r.name })));
        const classesUi = transformClasses(classesRows.map((c) => ({ slug: c.slug, name: c.name, hit_die: c.hit_die })));
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
    racesByIndex,
    classesByIndex,
    spellsByIndex,
    featsByIndex,
    equipmentByIndex,
    weaponMasteryByIndex
  } satisfies RulesetSrdCatalog;
}

