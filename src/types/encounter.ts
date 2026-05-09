export type EncounterEntity = {
  id: string;
  kind: "pc" | "monster";
  displayName: string;
  characterId?: string;
  monsterId?: string;
  /** 0 = standby (excluded from turn order). */
  initiative: number;
  maxHp: number;
  currentHp: number;
  tempHp?: number;
  /** DM-managed conditions for monsters; PCs use linked character `conditionSlugs`. */
  conditionSlugs?: string[];
  status?: "dead";
  /** Only used for PCs at 0 HP. */
  deathSaves?: { successes: number; fails: number };
};

/** Stored in `encounters.data` (schemaVersion 1). */
export type EncounterDataV1 = {
  schemaVersion: 1;
  players: { characterId: string }[];
  monsterPicks: { monsterId: string; count: number }[];
  /** Set when encounter has started (`status` ongoing/finished). */
  round?: number;
  activeEntityId?: string | null;
  entities?: EncounterEntity[];
};

export function emptyEncounterDataV1(): EncounterDataV1 {
  return { schemaVersion: 1, players: [], monsterPicks: [] };
}
