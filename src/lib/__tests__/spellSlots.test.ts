import { describe, expect, it } from "vitest";
import type { DndClass } from "@/lib/dndData";
import { computeSpellSlotsRemaining, spellSlotMaximaForClass } from "@/lib/spellSlots";

describe("spellSlots", () => {
  it("wizard level 3 uses full caster table", () => {
    const wiz: DndClass = { index: "wizard", name: "Wizard", hit_die: 6 };
    const m = spellSlotMaximaForClass(wiz, 3);
    expect(m.kind).toBe("standard");
    if (m.kind === "standard") {
      expect(m.maxBySpellLevel[1]).toBe(4);
      expect(m.maxBySpellLevel[2]).toBe(2);
    }
  });

  it("warlock level 5 uses pact slot level 3", () => {
    const wl: DndClass = { index: "warlock", name: "Warlock", hit_die: 8 };
    const m = spellSlotMaximaForClass(wl, 5);
    expect(m.kind).toBe("pact");
    if (m.kind === "pact") {
      expect(m.max).toBe(3);
      expect(m.slotSpellLevel).toBe(3);
    }
  });

  it("artificer level 5 uses half caster table", () => {
    const art: DndClass = { index: "artificer", name: "Artificer", hit_die: 8 };
    const m = spellSlotMaximaForClass(art, 5);
    expect(m.kind).toBe("standard");
    if (m.kind === "standard") {
      expect(m.maxBySpellLevel[1]).toBe(4);
      expect(m.maxBySpellLevel[2]).toBe(2);
    }
  });

  it("computeSpellSlotsRemaining respects used counts", () => {
    const wiz: DndClass = { index: "wizard", name: "Wizard", hit_die: 6 };
    const m = spellSlotMaximaForClass(wiz, 3);
    const rows = computeSpellSlotsRemaining(m, { "1": 1, "2": 2 });
    const first = rows.find((r) => r.spellLevel === 1);
    expect(first?.remaining).toBe(3);
  });
});
