import type { ClassRow, EquipmentRow, FeatRow, RaceRow, SpellRow, WeaponMasteryRow } from "@/lib/db/srd";

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

/**
 * Replace in-memory SRD cache.
 *
 * @param next Next SRD state.
 * @returns Nothing.
 */
export function setSrdState(next: SrdState) {
  state = next;
}

/**
 * Get current in-memory SRD cache.
 *
 * @returns SRD state, or null if not loaded.
 */
export function getSrdState(): SrdState | null {
  return state;
}

