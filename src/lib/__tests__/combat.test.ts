import { describe, expect, it } from "vitest";
import { canUseRecklessAttack } from "@/lib/combat";
import type { Character, EquippedItem } from "@/types/character";

function testCharacter(over: Partial<Character>): Character {
  return {
    id: "id",
    name: "n",
    world: "w",
    raceIndex: "human",
    classIndex: "barbarian",
    subclassIndex: null,
    level: 3,
    stats: { STR: 16, DEX: 10, CON: 14, INT: 8, WIS: 10, CHA: 10 },
    proficientSkills: [],
    proficientSaves: [],
    spells: [],
    feats: [],
    maxHp: 30,
    currentHp: 30,
    tempHp: 0,
    armorClass: 14,
    equipped: [],
    spellSlotsUsed: {},
    conditionSlugs: [],
    currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
    createdAt: 0,
    updatedAt: 0,
    ...over
  };
}

const axe: EquippedItem = { id: "w", equipmentIndex: "greataxe", modifier: 0 };
const bow: EquippedItem = { id: "b", equipmentIndex: "longbow", modifier: 0 };
const rapier: EquippedItem = { id: "r", equipmentIndex: "rapier", modifier: 0 };

describe("canUseRecklessAttack", () => {
  it("is true for barbarian level 2+ with STR melee weapon", () => {
    expect(canUseRecklessAttack(testCharacter({ level: 2 }), axe)).toBe(true);
  });

  it("is false below barbarian level 2", () => {
    expect(canUseRecklessAttack(testCharacter({ level: 1 }), axe)).toBe(false);
  });

  it("is false for non-barbarian", () => {
    expect(canUseRecklessAttack(testCharacter({ classIndex: "fighter" }), axe)).toBe(false);
  });

  it("is false for ranged weapon", () => {
    expect(canUseRecklessAttack(testCharacter({}), bow)).toBe(false);
  });

  it("is false when finesse uses DEX over STR", () => {
    const c = testCharacter({
      stats: { STR: 8, DEX: 18, CON: 14, INT: 8, WIS: 10, CHA: 10 }
    });
    expect(canUseRecklessAttack(c, rapier)).toBe(false);
  });

  it("is true when finesse uses STR over DEX", () => {
    const c = testCharacter({
      stats: { STR: 18, DEX: 8, CON: 14, INT: 8, WIS: 10, CHA: 10 }
    });
    expect(canUseRecklessAttack(c, rapier)).toBe(true);
  });
});
