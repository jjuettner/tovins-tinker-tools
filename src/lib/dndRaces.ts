import rawRaces from "@/data/PHB24/5e-SRD-Races.json";

export type DndRaceTraitRef = {
  index: string;
  name: string;
  url?: string;
};

export type DndRace = {
  index: string;
  name: string;
  speed?: number;
  traits?: DndRaceTraitRef[];
  subraces?: { index: string; name: string }[];
};

const races = rawRaces as unknown as DndRace[];

export const dndRaces: DndRace[] = [...races].sort((a, b) => a.name.localeCompare(b.name));

export const dndRaceByIndex: Record<string, DndRace> = Object.fromEntries(dndRaces.map((r) => [r.index, r]));
