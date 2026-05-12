import type { EquippedItem } from "@/types/character";
import { dndEquipmentByIndex, isBodyArmor, isShield, isWeapon } from "@/lib/dndEquipment";
import { newEquippedItemId } from "@/lib/randomId";

/**
 * Split equipped list into buckets used by UI.
 *
 * @param equipped Full equipped list.
 * @returns Weapons (including unknown/empty rows), first body armor, first shield.
 */
export function splitEquipped(equipped: EquippedItem[]): {
  weapons: EquippedItem[];
  bodyArmor: EquippedItem | null;
  shield: EquippedItem | null;
} {
  const weapons: EquippedItem[] = [];
  let bodyArmor: EquippedItem | null = null;
  let shield: EquippedItem | null = null;

  for (const item of equipped) {
    const idx = item.equipmentIndex;
    const eq = idx ? dndEquipmentByIndex[idx] : undefined;
    // Empty or unknown index = in-progress weapon row (Add weapon must survive round-trip).
    if (!idx || !eq) {
      weapons.push(item);
      continue;
    }
    if (isShield(eq)) {
      if (!shield) shield = item;
      continue;
    }
    if (isBodyArmor(eq)) {
      if (!bodyArmor) bodyArmor = item;
      continue;
    }
    if (isWeapon(eq)) {
      weapons.push(item);
      continue;
    }
    weapons.push(item);
  }
  return { weapons, bodyArmor, shield };
}

/**
 * Merge equipped buckets back into a single list.
 *
 * @param weapons Weapon rows.
 * @param bodyArmor Body armor row (or null).
 * @param shield Shield row (or null).
 * @returns Combined equipped list.
 */
export function rebuildEquipped(
  weapons: EquippedItem[],
  bodyArmor: EquippedItem | null,
  shield: EquippedItem | null
): EquippedItem[] {
  return [...weapons, ...(bodyArmor ? [bodyArmor] : []), ...(shield ? [shield] : [])];
}

/**
 * Create an empty weapon row for editor UI.
 *
 * @returns Empty equipped weapon row.
 */
export function emptyWeapon(): EquippedItem {
  return { id: newEquippedItemId(), equipmentIndex: "", modifier: 0, flatDamageBonus: 0 };
}
