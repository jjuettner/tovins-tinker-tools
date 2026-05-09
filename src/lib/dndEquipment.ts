import rawEquipment from "@/data/PHB24/5e-Equipment.json";

export type DndEquipmentCategory = {
  index: string;
  name: string;
  url?: string;
};

export type DndEquipment = {
  index: string;
  name: string;
  equipment_categories?: DndEquipmentCategory[];
  damage?: {
    damage_dice: string;
    damage_type?: { index: string; name: string };
  };
  two_handed_damage?: {
    damage_dice: string;
    damage_type?: { index: string; name: string };
  };
  range?: { normal?: number; long?: number | null };
  properties?: { index: string; name: string }[];
  mastery?: { index: string; name: string; url?: string };
  armor_class?: {
    base: number;
    dex_bonus?: boolean;
    max_bonus?: number | null;
  };
  weight?: number;
};

const equipment = rawEquipment as unknown as DndEquipment[];

export const dndEquipment: DndEquipment[] = [...equipment].sort((a, b) => a.name.localeCompare(b.name));

export const dndEquipmentByIndex: Record<string, DndEquipment> = Object.fromEntries(
  dndEquipment.map((e) => [e.index, e])
);

/**
 * Check if equipment belongs to a category.
 *
 * @param eq Equipment row.
 * @param index Category index.
 * @returns True if equipment has the category.
 */
export function equipmentHasCategory(eq: DndEquipment, index: string): boolean {
  return Boolean(eq.equipment_categories?.some((c) => c.index === index));
}

/**
 * Check if equipment is a weapon.
 *
 * @param eq Equipment row.
 * @returns True if weapon.
 */
export function isWeapon(eq: DndEquipment): boolean {
  return equipmentHasCategory(eq, "weapons");
}

/**
 * Check if equipment is a shield.
 *
 * @param eq Equipment row.
 * @returns True if shield.
 */
export function isShield(eq: DndEquipment): boolean {
  return equipmentHasCategory(eq, "shields");
}

/**
 * Check if equipment is body armor (not a shield).
 *
 * @param eq Equipment row.
 * @returns True if body armor.
 */
export function isBodyArmor(eq: DndEquipment): boolean {
  return equipmentHasCategory(eq, "armor") && !isShield(eq);
}

/**
 * Short armor AC formula for labels (e.g. select options).
 *
 * @param eq Equipment row with `armor_class` (armor or shield).
 * @returns Text like `18`, `11 + DEX`, or `15 + DEX (max +2)`; empty if no AC block.
 */
export function armorAcRulesText(eq: DndEquipment): string {
  const ac = eq.armor_class;
  if (!ac) return "";
  const { base, dex_bonus: dexBonus, max_bonus: maxBonus } = ac;
  if (dexBonus === false) {
    return String(base);
  }
  if (maxBonus == null) {
    return `${base} + DEX`;
  }
  return `${base} + DEX (max +${maxBonus})`;
}

export const dndWeapons: DndEquipment[] = dndEquipment.filter(isWeapon);

export const dndArmorPieces: DndEquipment[] = dndEquipment.filter(
  (e) => equipmentHasCategory(e, "armor") || isShield(e)
);

/**
 * Check if a weapon has the finesse property.
 *
 * @param eq Equipment row.
 * @returns True if finesse.
 */
export function weaponIsFinesse(eq: DndEquipment): boolean {
  return Boolean(eq.properties?.some((p) => p.index === "finesse"));
}

/**
 * Check if a weapon is ranged.
 *
 * @param eq Equipment row.
 * @returns True if ranged weapon.
 */
export function weaponIsRanged(eq: DndEquipment): boolean {
  return equipmentHasCategory(eq, "ranged-weapons");
}

/**
 * Check if a weapon has the versatile property.
 *
 * @param eq Equipment row.
 * @returns True if versatile.
 */
export function weaponIsVersatile(eq: DndEquipment): boolean {
  return Boolean(eq.properties?.some((p) => p.index === "versatile"));
}
