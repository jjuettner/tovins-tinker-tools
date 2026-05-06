import raw from "@/data/PHB24/5e-SRD-Weapon-Mastery-Properties.json";

export type DndWeaponMastery = {
  index: string;
  name: string;
  description?: string;
};

const list = raw as unknown as DndWeaponMastery[];

export const dndWeaponMasteries: DndWeaponMastery[] = [...list].sort((a, b) => a.name.localeCompare(b.name));

export const dndWeaponMasteryByIndex: Record<string, DndWeaponMastery> = Object.fromEntries(
  dndWeaponMasteries.map((m) => [m.index, m])
);
