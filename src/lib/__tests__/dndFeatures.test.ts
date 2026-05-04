import { describe, expect, it } from "vitest";
import { unlockedBaseClassFeaturesFromSrd } from "../dndFeatures";

describe("unlockedBaseClassFeaturesFromSrd", () => {
  it("barbarian level 2 includes Rage and Unarmored Defense", () => {
    const rows = unlockedBaseClassFeaturesFromSrd("barbarian", 2);
    const names = rows.map((r) => r.name);
    expect(names).toContain("Rage");
    expect(names).toContain("Unarmored Defense");
    expect(names).toContain("Reckless Attack");
    expect(names).toContain("Danger Sense");
  });

  it("barbarian level 1 does not include level-2 features", () => {
    const rows = unlockedBaseClassFeaturesFromSrd("barbarian", 1);
    const names = rows.map((r) => r.name);
    expect(names).toContain("Rage");
    expect(names).not.toContain("Reckless Attack");
  });

  it("fighter level 1 lists Fighting Style once, not Archery sub-row", () => {
    const rows = unlockedBaseClassFeaturesFromSrd("fighter", 1);
    const names = rows.map((r) => r.name);
    expect(names).toContain("Fighting Style");
    expect(names.filter((n) => n.startsWith("Fighting Style:"))).toHaveLength(0);
  });
});
