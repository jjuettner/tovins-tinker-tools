import rawClasses from "@/data/PHB24/5e-SRD-Classes.json";
import rawFeats from "@/data/PHB24/5e-SRD-Feats.json";
import rawSpells from "@/data/PHB24/5e-SRD-Spells.json";

export type DndClass = {
  index: string;
  name: string;
  hit_die: number;
};

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

const classes = (rawClasses as unknown as { index: string; name: string; hit_die?: number }[]).map((c) => ({
  index: c.index,
  name: c.name,
  hit_die: typeof c.hit_die === "number" ? c.hit_die : 8
}));
const feats = rawFeats as unknown as DndFeat[];
const spells = rawSpells as unknown as DndSpell[];

export const dndClasses: DndClass[] = [...classes].sort((a, b) => a.name.localeCompare(b.name));
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
 * @param classIndex SRD class index.
 * @returns Spells on class list (or full list).
 */
export function spellsOnClassList(classIndex: string): DndSpell[] {
  const idx = classIndex.trim();
  if (!idx) return dndSpells;
  const onList = dndSpells.filter((s) => s.classes?.some((c) => c.index === idx));
  return onList.length > 0 ? onList : dndSpells;
}

