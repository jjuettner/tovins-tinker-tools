import rawClasses from "@/data/PHB24/5e-Classes.json";
import rawFeats from "@/data/PHB24/5e-Feats.json";
import rawSpells from "@/data/PHB24/5e-Spells.json";
import { subclassesFromClassData, type DndSubclassOption } from "@/lib/ruleset/classSubclasses";

export type DndClass = {
  index: string;
  name: string;
  hit_die: number;
  /** From bundled / ruleset class `data.subclasses`. */
  subclasses?: DndSubclassOption[];
};

export type { DndSubclassOption };

export type DndFeat = {
  index: string;
  name: string;
  description?: string;
  type?: string;
  repeatable?: string;
};

export type DndSpell = {
  index: string;
  name: string;
  level: number;
  school?: { index: string; name: string };
  classes?: { index: string; name?: string }[];
  desc?: string[];
  higher_level?: string[];
  range?: string;
  duration?: string;
  casting_time?: string;
  concentration?: boolean;
  ritual?: boolean;
};

const classes = (rawClasses as unknown as Record<string, unknown>[]).map((c) => ({
  index: typeof c.index === "string" ? c.index : "",
  name: typeof c.name === "string" ? c.name : "",
  hit_die: typeof c.hit_die === "number" ? c.hit_die : 8,
  subclasses: subclassesFromClassData(c)
}));
const feats = rawFeats as unknown as DndFeat[];
const spells = rawSpells as unknown as DndSpell[];

export const dndClasses: DndClass[] = [...classes]
  .filter((c) => c.index && c.name)
  .sort((a, b) => a.name.localeCompare(b.name));
export const dndFeats: DndFeat[] = [...feats].sort((a, b) => a.name.localeCompare(b.name));
export const dndSpells: DndSpell[] = [...spells].sort((a, b) => a.name.localeCompare(b.name));

export const dndClassByIndex: Record<string, DndClass> = Object.fromEntries(dndClasses.map((c) => [c.index, c]));
export const dndFeatByIndex: Record<string, DndFeat> = Object.fromEntries(dndFeats.map((f) => [f.index, f]));
export const dndSpellByIndex: Record<string, DndSpell> = Object.fromEntries(dndSpells.map((s) => [s.index, s]));

/**
 * Get spells whose `classes` includes this class index.
 *
 * If none match (bad data), falls back to the full spell list.
 *
 * @param classIndex Ruleset class slug.
 * @returns Spells on class list (or full list).
 */
export function spellsOnClassList(classIndex: string): DndSpell[] {
  const idx = classIndex.trim();
  if (!idx) return dndSpells;
  const onList = dndSpells.filter((s) => s.classes?.some((c) => c.index === idx));
  return onList.length > 0 ? onList : dndSpells;
}

