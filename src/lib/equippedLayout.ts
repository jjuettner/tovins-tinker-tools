import type { EquippedItem } from "../types/character";
import { dndEquipmentByIndex, isBodyArmor, isShield, isWeapon } from "./dndEquipment";
import { newEquippedItemId } from "./randomId";

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

export function rebuildEquipped(
  weapons: EquippedItem[],
  bodyArmor: EquippedItem | null,
  shield: EquippedItem | null
): EquippedItem[] {
  return [...weapons, ...(bodyArmor ? [bodyArmor] : []), ...(shield ? [shield] : [])];
}

export function emptyWeapon(): EquippedItem {
  return { id: newEquippedItemId(), equipmentIndex: "", modifier: 0 };
}
