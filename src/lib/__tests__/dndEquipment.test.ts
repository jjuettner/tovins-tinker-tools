import { describe, expect, it } from "vitest";
import { armorAcRulesText, dndEquipmentByIndex } from "@/lib/dndEquipment";

describe("armorAcRulesText", () => {
  it("formats fixed AC when DEX does not apply", () => {
    expect(armorAcRulesText(dndEquipmentByIndex["plate-armor"])).toBe("18");
  });

  it("formats light armor with full DEX", () => {
    expect(armorAcRulesText(dndEquipmentByIndex["leather-armor"])).toBe("11 + DEX");
  });

  it("formats medium armor with DEX cap", () => {
    expect(armorAcRulesText(dndEquipmentByIndex["half-plate-armor"])).toBe("15 + DEX (max +2)");
  });
});
