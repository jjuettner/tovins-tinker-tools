import { describe, expect, it } from "vitest";
import { raceSpeedFeetFromCatalogData } from "@/lib/dndRaces";

describe("raceSpeedFeetFromCatalogData", () => {
  it("returns null for non-object", () => {
    expect(raceSpeedFeetFromCatalogData(null)).toBeNull();
    expect(raceSpeedFeetFromCatalogData(undefined)).toBeNull();
    expect(raceSpeedFeetFromCatalogData("x")).toBeNull();
  });

  it("reads positive integer speed", () => {
    expect(raceSpeedFeetFromCatalogData({ speed: 30 })).toBe(30);
    expect(raceSpeedFeetFromCatalogData({ speed: 25.9 })).toBe(25);
  });

  it("rejects non-positive or non-finite", () => {
    expect(raceSpeedFeetFromCatalogData({ speed: 0 })).toBeNull();
    expect(raceSpeedFeetFromCatalogData({ speed: -5 })).toBeNull();
    expect(raceSpeedFeetFromCatalogData({ speed: NaN })).toBeNull();
  });
});
