import { abilityMod, proficiencyBonus, type Ability } from "@/lib/dnd";
import type { DndEquipment } from "@/lib/dndEquipment";
import { dndEquipmentByIndex, isWeapon, weaponIsFinesse, weaponIsRanged } from "@/lib/dndEquipment";
import type { Character, EquippedItem } from "@/types/character";

/**
 * Resolve weapon mastery index for an equipped weapon.
 *
 * Prefers saved override when set; otherwise uses default mastery on the equipment row.
 *
 * @param weapon Equipped weapon instance.
 * @param eq Equipment row for this weapon (if known).
 * @returns Mastery index, or undefined if not proficient / missing.
 */
export function resolvedWeaponMasteryIndex(weapon: EquippedItem, eq: DndEquipment | undefined): string | undefined {
  if (!weapon.masteryProficient) return undefined;
  const o = weapon.masteryIndex?.trim();
  if (o) return o;
  return eq?.mastery?.index;
}

/**
 * Pick the ability used for an attack with a weapon, plus its modifier.
 *
 * @param stats Ability scores.
 * @param eq Equipment row (weapon).
 * @returns Selected ability and computed modifier.
 */
export function weaponAbilityAndMod(
  stats: Record<Ability, number>,
  eq: DndEquipment | undefined
): { ability: Ability; mod: number } {
  if (!eq || !isWeapon(eq)) {
    return { ability: "STR", mod: abilityMod(stats.STR) };
  }
  if (weaponIsRanged(eq)) {
    return { ability: "DEX", mod: abilityMod(stats.DEX) };
  }
  if (weaponIsFinesse(eq)) {
    const sm = abilityMod(stats.STR);
    const dm = abilityMod(stats.DEX);
    return sm >= dm ? { ability: "STR", mod: sm } : { ability: "DEX", mod: dm };
  }
  return { ability: "STR", mod: abilityMod(stats.STR) };
}

/**
 * Compute to-hit bonus for a weapon attack (including proficiency + weapon modifier).
 *
 * @param c Character.
 * @param weapon Equipped weapon.
 * @returns Total attack bonus.
 */
export function weaponToHitBonus(c: Character, weapon: EquippedItem): number {
  const eq = dndEquipmentByIndex[weapon.equipmentIndex];
  if (!eq || !isWeapon(eq)) return abilityMod(c.stats.STR) + proficiencyBonus(c.level);
  const { mod } = weaponAbilityAndMod(c.stats, eq);
  return mod + proficiencyBonus(c.level) + weapon.modifier;
}

/**
 * Whether barbarian Reckless Attack can apply to this weapon attack (level 2+, melee, STR-based).
 *
 * @param c Character sheet.
 * @param weapon Equipped weapon row.
 * @returns True when UI should offer Reckless Attack for this swing.
 */
export function canUseRecklessAttack(c: Character, weapon: EquippedItem): boolean {
  if (c.classIndex.trim().toLowerCase() !== "barbarian" || c.level < 2) return false;
  const eq = dndEquipmentByIndex[weapon.equipmentIndex];
  if (!eq || !isWeapon(eq) || weaponIsRanged(eq)) return false;
  const { ability } = weaponAbilityAndMod(c.stats, eq);
  return ability === "STR";
}

/**
 * Summarize weapon damage dice, bonus, and type.
 *
 * @param c Character.
 * @param weapon Equipped weapon.
 * @returns Damage summary payload for UI.
 */
export function weaponDamageSummary(c: Character, weapon: EquippedItem): { dice: string; bonus: number; type: string } {
  const eq = dndEquipmentByIndex[weapon.equipmentIndex];
  if (!eq?.damage?.damage_dice) {
    const { mod } = weaponAbilityAndMod(c.stats, eq);
    return { dice: "1", bonus: mod + weapon.modifier, type: "bludgeoning" };
  }
  const { mod } = weaponAbilityAndMod(c.stats, eq);
  const type = eq.damage.damage_type?.index ?? "bludgeoning";
  return { dice: eq.damage.damage_dice, bonus: mod + weapon.modifier, type };
}

/**
 * Compute to-hit bonus for an unarmed strike.
 *
 * @param c Character.
 * @returns Attack bonus.
 */
export function unarmedToHit(c: Character): number {
  return abilityMod(c.stats.STR) + proficiencyBonus(c.level);
}

/**
 * Compute damage bonus for an unarmed strike.
 *
 * @param c Character.
 * @returns Damage bonus (ability mod).
 */
export function unarmedDamageBonus(c: Character): number {
  return abilityMod(c.stats.STR);
}
