import { describe, expect, it } from "vitest";
import { computeArmorClass } from "@/lib/character/armorClass";

describe("computeArmorClass barbarian Unarmored Defense", () => {
  it("uses 10 + DEX + CON when barbarian has no body armor", () => {
    expect(
      computeArmorClass([], 2, { classIndex: "barbarian", conMod: 3 })
    ).toBe(15);
  });

  it("uses 10 + DEX only for non-barbarian", () => {
    expect(computeArmorClass([], 2, { classIndex: "fighter", conMod: 3 })).toBe(12);
  });

  it("ignores CON bonus when body armor is equipped", () => {
    const equipped = [{ id: "a", equipmentIndex: "leather-armor", modifier: 0 }];
    // PHB24 leather: 11 + DEX (no cap); dexMod 2 -> 13. Not max with UD (10+2+3).
    expect(computeArmorClass(equipped, 2, { classIndex: "barbarian", conMod: 3 })).toBe(13);
  });

  it("still adds shield when using barbarian UD", () => {
    const equipped = [{ id: "s", equipmentIndex: "shield", modifier: 0 }];
    expect(computeArmorClass(equipped, 1, { classIndex: "barbarian", conMod: 1 })).toBe(10 + 1 + 1 + 2);
  });
});
