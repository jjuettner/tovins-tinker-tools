import { dndEquipmentByIndex, isHeavyBodyArmor } from "@/lib/dndEquipment";
import { splitEquipped } from "@/lib/equippedLayout";
import type { Character } from "@/types/character";

/** Barbarian Fast Movement (5e): + walking speed outside heavy armor. */
const BARBARIAN_FAST_MOVEMENT_FT = 10;
const BARBARIAN_FAST_MOVEMENT_MIN_LEVEL = 5;

function characterWearsHeavyBodyArmor(c: Character): boolean {
  const { bodyArmor } = splitEquipped(c.equipped);
  if (!bodyArmor?.equipmentIndex) return false;
  const eq = dndEquipmentByIndex[bodyArmor.equipmentIndex];
  return Boolean(eq && isHeavyBodyArmor(eq));
}

/**
 * Effective walking speed in feet after class features (race baseline + modifiers).
 *
 * @param c Character sheet (level, class, equipment).
 * @param baseRaceSpeedFt Race walking speed from catalog, or null if unknown.
 * @returns Whole feet, or null when race speed is unknown.
 */
export function effectiveWalkSpeedFeet(c: Character, baseRaceSpeedFt: number | null): number | null {
  if (baseRaceSpeedFt == null || !Number.isFinite(baseRaceSpeedFt)) return null;
  let ft = Math.floor(baseRaceSpeedFt);
  const barb = c.classIndex.trim().toLowerCase() === "barbarian";
  if (
    barb &&
    c.level >= BARBARIAN_FAST_MOVEMENT_MIN_LEVEL &&
    !characterWearsHeavyBodyArmor(c)
  ) {
    ft += BARBARIAN_FAST_MOVEMENT_FT;
  }
  return ft;
}
