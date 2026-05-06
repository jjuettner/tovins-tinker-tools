import rawTraits from "@/data/PHB24/5e-SRD-Traits.json";

export type DndTrait = {
  index: string;
  name: string;
  description?: string;
};

const traits = rawTraits as unknown as DndTrait[];

export const dndTraits: DndTrait[] = [...traits].sort((a, b) => a.name.localeCompare(b.name));

export const dndTraitByIndex: Record<string, DndTrait> = Object.fromEntries(dndTraits.map((t) => [t.index, t]));
