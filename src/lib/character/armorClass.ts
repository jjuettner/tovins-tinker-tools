import type { EquippedItem } from "@/types/character";
import type { DndEquipment } from "@/lib/dndEquipment";
import { dndEquipmentByIndex, isBodyArmor, isShield } from "@/lib/dndEquipment";

/**
 * Compute armor class contribution of a single armor item.
 *
 * @param eq Equipment row.
 * @param dexMod Dexterity modifier.
 * @param magicPlus Magic modifier to add to base AC.
 * @returns Armor AC value (not including shields).
 */
function armorContribution(eq: DndEquipment, dexMod: number, magicPlus: number): number {
  const ac = eq.armor_class;
  if (!ac) return 0;
  const base = ac.base + magicPlus;
  if (ac.dex_bonus === false) return base;
  const cap = ac.max_bonus == null ? 99 : ac.max_bonus;
  return base + Math.min(dexMod, cap);
}

/**
 * Compute best armor class for equipped items.
 *
 * Uses best of: unarmored (10 + DEX) vs best body armor, plus sum of shields.
 *
 * @param equipped Equipped items (optional).
 * @param dexMod Dexterity modifier.
 * @returns Armor class.
 */
export function computeArmorClass(equipped: EquippedItem[] | undefined, dexMod: number): number {
  const items = equipped ?? [];
  const bestUnarmored = 10 + dexMod;
  let bestArmor = 0;
  let shield = 0;

  for (const item of items) {
    const eq = dndEquipmentByIndex[item.equipmentIndex];
    if (!eq?.armor_class) continue;

    if (isShield(eq)) {
      shield += eq.armor_class.base + item.modifier;
      continue;
    }

    if (isBodyArmor(eq)) {
      bestArmor = Math.max(bestArmor, armorContribution(eq, dexMod, item.modifier));
    }
  }

  const body = Math.max(bestUnarmored, bestArmor);
  return body + shield;
}

