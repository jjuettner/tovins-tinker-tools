import { abilityMod, proficiencyBonus, type Ability } from "@/lib/dnd";
import type { Character } from "@/types/character";

const SPELLCASTING_ABILITY_BY_CLASS_INDEX: Partial<Record<string, Ability>> = {
  artificer: "INT",
  bard: "CHA",
  cleric: "WIS",
  druid: "WIS",
  paladin: "CHA",
  ranger: "WIS",
  sorcerer: "CHA",
  warlock: "CHA",
  wizard: "INT"
};

/**
 * Get spellcasting ability for a class index.
 *
 * @param classIndex Ruleset class slug (e.g. `wizard`).
 * @returns Ability used for spellcasting, or null if unknown/non-caster.
 */
export function spellcastingAbilityForClassIndex(classIndex: string): Ability | null {
  const key = classIndex.trim();
  return SPELLCASTING_ABILITY_BY_CLASS_INDEX[key] ?? null;
}

/**
 * Compute spell attack modifier and save DC for a character.
 *
 * Assumptions:
 * - Uses core 5e math: attack = prof + ability mod; DC = 8 + prof + ability mod.
 * - Returns null if class spellcasting ability is unknown.
 *
 * @param c Character.
 * @returns Attack and DC numbers, or null.
 */
export function spellAttackAndSaveDcForCharacter(
  c: Character
): { spellAttackMod: number; spellSaveDc: number; ability: Ability } | null {
  const ability = spellcastingAbilityForClassIndex(c.classIndex);
  if (!ability) return null;
  const mod = abilityMod(c.stats[ability] ?? 10);
  const prof = proficiencyBonus(c.level);
  return { spellAttackMod: prof + mod, spellSaveDc: 8 + prof + mod, ability };
}

