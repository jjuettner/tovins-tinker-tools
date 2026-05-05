import type { Character, CharacterDraft, EquippedItem } from "../types/character";
import { abilityMod, clampLevel } from "./dnd";
import { dndClassByIndex } from "./dndData";
import { computeArmorClass } from "./armorClass";
import { newEquippedItemId } from "./randomId";

export { newEquippedItemId } from "./randomId";

function defaultMaxHp(level: number, conMod: number, hitDie: number): number {
  const lv = clampLevel(level);
  const first = Math.max(1, hitDie + conMod);
  if (lv <= 1) return first;
  const per = Math.max(1, Math.floor(hitDie / 2) + 1 + conMod);
  return first + (lv - 1) * per;
}

export function normalizeCharacter(c: Character): Character {
  const level = clampLevel(c.level);
  const cls = dndClassByIndex[c.classIndex];
  const hitDie = cls?.hit_die ?? 8;
  const conMod = abilityMod(c.stats.CON);
  const dexMod = abilityMod(c.stats.DEX);

  const equipped: EquippedItem[] = Array.isArray(c.equipped)
    ? c.equipped.map((e) => ({
        id: e.id && e.id.length > 0 ? e.id : newEquippedItemId(),
        equipmentIndex: e.equipmentIndex ?? "",
        modifier: Number.isFinite(e.modifier) ? Math.floor(e.modifier) : 0,
        masteryIndex:
          typeof e.masteryIndex === "string" && e.masteryIndex.trim().length > 0
            ? e.masteryIndex.trim()
            : undefined,
        masteryProficient: typeof e.masteryProficient === "boolean" ? e.masteryProficient : false
      }))
    : [];

  const maxHp =
    Number.isFinite(c.maxHp) && (c.maxHp as number) > 0 ? Math.floor(c.maxHp as number) : defaultMaxHp(level, conMod, hitDie);

  let currentHp = Number.isFinite(c.currentHp) ? Math.floor(c.currentHp as number) : maxHp;
  currentHp = Math.min(maxHp, Math.max(0, currentHp));

  const tempHp = Number.isFinite(c.tempHp) ? Math.max(0, Math.floor(c.tempHp as number)) : 0;

  const spellSlotsUsed =
    c.spellSlotsUsed && typeof c.spellSlotsUsed === "object" ? { ...c.spellSlotsUsed } : {};

  const armorClass = computeArmorClass(equipped, dexMod);

  return {
    ...c,
    raceIndex: typeof c.raceIndex === "string" ? c.raceIndex.trim() : "",
    level,
    equipped,
    maxHp,
    currentHp,
    tempHp,
    armorClass,
    spellSlotsUsed
  };
}

export function normalizeDraft(d: CharacterDraft): CharacterDraft {
  const n = normalizeCharacter({ ...d, createdAt: 0, updatedAt: 0 } as Character);
  return {
    ...d,
    raceIndex: n.raceIndex,
    level: n.level,
    equipped: n.equipped,
    maxHp: n.maxHp,
    currentHp: n.currentHp,
    tempHp: n.tempHp,
    armorClass: n.armorClass,
    spellSlotsUsed: n.spellSlotsUsed
  };
}
