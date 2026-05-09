import type {
  ClassRow,
  ClassSpellSlotsRow,
  EquipmentRow,
  FeatRow,
  RaceRow,
  SpellRow,
  WeaponMasteryRow
} from "@/lib/db/rulesetCatalog";

export type RulesetCatalogCache = {
  spells: SpellRow[];
  classes: ClassRow[];
  races: RaceRow[];
  feats: FeatRow[];
  equipment: EquipmentRow[];
  weaponMastery: WeaponMasteryRow[];
  classSpellSlots: ClassSpellSlotsRow[];
};

let state: RulesetCatalogCache | null = null;

/**
 * Replace in-memory ruleset catalog snapshot (prefetched defaults).
 *
 * @param next Next cache snapshot.
 * @returns Nothing.
 */
export function setRulesetCatalogCache(next: RulesetCatalogCache) {
  state = next;
}

/**
 * Get current in-memory ruleset catalog cache.
 *
 * @returns Cache snapshot, or null when not prefetched yet.
 */
export function getRulesetCatalogCache(): RulesetCatalogCache | null {
  return state;
}
