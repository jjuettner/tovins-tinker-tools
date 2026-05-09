import { describe, expect, it } from "vitest";
import {
  addCurrency,
  EMPTY_CURRENCY_POUCH,
  pouchTotalCp,
  subtractCurrency
} from "@/lib/character/currency";

describe("addCurrency", () => {
  it("does not carry upwards on add", () => {
    const pouch = { pp: 0, gp: 1, ep: 0, sp: 9, cp: 9 };
    const after = addCurrency(pouch, { ...EMPTY_CURRENCY_POUCH, cp: 1 });
    expect(after).toEqual({ pp: 0, gp: 1, ep: 0, sp: 9, cp: 10 });
    expect(pouchTotalCp(after)).toBe(200);
  });
});

describe("subtractCurrency", () => {
  it("rejects when not enough combined value", () => {
    const r = subtractCurrency(
      { pp: 0, gp: 1, ep: 0, sp: 0, cp: 0 },
      { pp: 0, gp: 2, ep: 0, sp: 0, cp: 0 }
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.shortByCp).toBe(100);
  });

  it("spends across denominations", () => {
    const r = subtractCurrency(
      { pp: 0, gp: 2, ep: 0, sp: 0, cp: 0 },
      { pp: 0, gp: 0, ep: 0, sp: 5, cp: 5 }
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.pouch).toEqual({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 145 });
  });
});
