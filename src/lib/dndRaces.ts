import rawRaces from "@/data/PHB24/5e-Races.json";

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

/**
 * Read walking speed in feet from a ruleset race row `data` blob (matches seeded PHB JSON shape).
 *
 * @param data JSON from `public.races.data`.
 * @returns Whole feet, or null when missing or invalid.
 */
export function raceSpeedFeetFromCatalogData(data: unknown): number | null {
  if (!data || typeof data !== "object") return null;
  const s = (data as Record<string, unknown>).speed;
  if (typeof s !== "number" || !Number.isFinite(s) || s <= 0) return null;
  return Math.floor(s);
}

const races = rawRaces as unknown as DndRace[];

export const dndRaces: DndRace[] = [...races].sort((a, b) => a.name.localeCompare(b.name));

export const dndRaceByIndex: Record<string, DndRace> = Object.fromEntries(dndRaces.map((r) => [r.index, r]));
