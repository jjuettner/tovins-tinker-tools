import type { ClassRow, EquipmentRow, FeatRow, RaceRow, SpellRow, WeaponMasteryRow } from "./db/srd";

export type SrdState = {
  spells: SpellRow[];
  classes: ClassRow[];
  races: RaceRow[];
  feats: FeatRow[];
  equipment: EquipmentRow[];
  weaponMastery: WeaponMasteryRow[];
  classSpellSlots: { ruleset_id: string; class_slug: string; level: number; slots: unknown }[];
};

let state: SrdState | null = null;

export function setSrdState(next: SrdState) {
  state = next;
}

export function getSrdState(): SrdState | null {
  return state;
}

