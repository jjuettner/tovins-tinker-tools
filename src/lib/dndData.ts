import rawClasses from "../data/5e-SRD-Classes.json";
import rawFeats from "../data/5e-SRD-Feats.json";
import rawSpells from "../data/5e-SRD-Spells.json";

export type DndClass = {
  index: string;
  name: string;
  hit_die?: number;
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
};

const classes = rawClasses as unknown as DndClass[];
const feats = rawFeats as unknown as DndFeat[];
const spells = rawSpells as unknown as DndSpell[];

export const dndClasses: DndClass[] = [...classes].sort((a, b) => a.name.localeCompare(b.name));
export const dndFeats: DndFeat[] = [...feats].sort((a, b) => a.name.localeCompare(b.name));
export const dndSpells: DndSpell[] = [...spells].sort((a, b) => a.name.localeCompare(b.name));

export const dndClassByIndex: Record<string, DndClass> = Object.fromEntries(dndClasses.map((c) => [c.index, c]));
export const dndFeatByIndex: Record<string, DndFeat> = Object.fromEntries(dndFeats.map((f) => [f.index, f]));
export const dndSpellByIndex: Record<string, DndSpell> = Object.fromEntries(dndSpells.map((s) => [s.index, s]));

