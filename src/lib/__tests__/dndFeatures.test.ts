import { describe, expect, it } from "vitest";
import { unlockedBaseClassFeatures } from "@/lib/dndFeatures";

describe("unlockedBaseClassFeatures", () => {
  it("barbarian level 2 includes Rage and Unarmored Defense", () => {
    const rows = unlockedBaseClassFeatures("barbarian", 2);
    const names = rows.map((r) => r.name);
    expect(names).toContain("Rage");
    expect(names).toContain("Unarmored Defense");
    expect(names).toContain("Reckless Attack");
    expect(names).toContain("Danger Sense");
  });

  it("barbarian level 1 does not include level-2 features", () => {
    const rows = unlockedBaseClassFeatures("barbarian", 1);
    const names = rows.map((r) => r.name);
    expect(names).toContain("Rage");
    expect(names).not.toContain("Reckless Attack");
  });

  it("fighter level 1 lists Fighting Style once, not Archery sub-row", () => {
    const rows = unlockedBaseClassFeatures("fighter", 1);
    const names = rows.map((r) => r.name);
    expect(names).toContain("Fighting Style");
    expect(names.filter((n) => n.startsWith("Fighting Style:"))).toHaveLength(0);
  });
});
