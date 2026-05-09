import { describe, expect, it } from "vitest";
import { effectiveWalkSpeedFeet } from "@/lib/character/effectiveWalkSpeed";
import type { Character, EquippedItem } from "@/types/character";

function char(over: Partial<Character>): Character {
  return {
    id: "i",
    name: "n",
    world: "w",
    raceIndex: "human",
    classIndex: "barbarian",
    subclassIndex: null,
    level: 5,
    stats: { STR: 14, DEX: 14, CON: 14, INT: 8, WIS: 10, CHA: 10 },
    proficientSkills: [],
    proficientSaves: [],
    spells: [],
    feats: [],
    maxHp: 40,
    currentHp: 40,
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

const leather: EquippedItem = { id: "a", equipmentIndex: "leather-armor", modifier: 0 };
const plate: EquippedItem = { id: "p", equipmentIndex: "plate-armor", modifier: 0 };

describe("effectiveWalkSpeedFeet", () => {
  it("returns null without race baseline", () => {
    expect(effectiveWalkSpeedFeet(char({}), null)).toBeNull();
  });

  it("passes through race-only speed", () => {
    expect(effectiveWalkSpeedFeet(char({ classIndex: "fighter", level: 5 }), 30)).toBe(30);
  });

  it("adds 10 for barbarian level 5+ without heavy armor", () => {
    expect(effectiveWalkSpeedFeet(char({ equipped: [], level: 5 }), 25)).toBe(35);
  });

  it("no bonus below level 5", () => {
    expect(effectiveWalkSpeedFeet(char({ level: 4 }), 30)).toBe(30);
  });

  it("no bonus in heavy armor", () => {
    expect(effectiveWalkSpeedFeet(char({ equipped: [plate], level: 6 }), 30)).toBe(30);
  });

  it("bonus with light armor", () => {
    expect(effectiveWalkSpeedFeet(char({ equipped: [leather], level: 6 }), 30)).toBe(40);
  });
});
