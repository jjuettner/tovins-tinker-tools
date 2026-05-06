import { describe, expect, it } from "vitest";
import { abilityMod, proficiencyBonus } from "@/lib/dnd";

describe("dnd", () => {
  it("abilityMod: 17 -> +3", () => {
    expect(abilityMod(17)).toBe(3);
  });

  it("abilityMod: 10 -> +0", () => {
    expect(abilityMod(10)).toBe(0);
  });

  it("proficiencyBonus: level 1 -> 2", () => {
    expect(proficiencyBonus(1)).toBe(2);
  });

  it("proficiencyBonus: level 5 -> 3", () => {
    expect(proficiencyBonus(5)).toBe(3);
  });

  it("proficiencyBonus: level 20 -> 6", () => {
    expect(proficiencyBonus(20)).toBe(6);
  });
});

