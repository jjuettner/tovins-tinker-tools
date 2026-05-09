import { buildSheetPassiveEntries } from "@/lib/character/sheetPassives";
import type { FeatureRow } from "@/lib/db/rulesetCatalog";
import { featureRowHasParent, selectUnlockedClassFeatures } from "@/lib/ruleset/classFeatures";
import type { Character } from "@/types/character";

const RS = "00000000-0000-0000-0000-000000000001";

function row(p: Partial<FeatureRow> & Pick<FeatureRow, "slug" | "name">): FeatureRow {
  return {
    ruleset_id: RS,
    slug: p.slug,
    name: p.name,
    class_slug: p.class_slug ?? null,
    subclass_slug: p.subclass_slug ?? null,
    level: p.level ?? null,
    data: p.data ?? {}
  };
}

describe("featureRowHasParent", () => {
  it("false when no parent", () => {
    expect(featureRowHasParent({ desc: ["x"] })).toBe(false);
  });
  it("true when parent has index", () => {
    expect(featureRowHasParent({ parent: { index: "fighting-style" } })).toBe(true);
  });
});

describe("selectUnlockedClassFeatures", () => {
  it("includes base class rows up to level and excludes higher levels", () => {
    const rows: FeatureRow[] = [
      row({ slug: "a", name: "Low", class_slug: "fighter", subclass_slug: null, level: 1, data: {} }),
      row({ slug: "b", name: "High", class_slug: "fighter", subclass_slug: null, level: 5, data: {} })
    ];
    const { base, subclass } = selectUnlockedClassFeatures(rows, { classSlug: "fighter", subclassSlug: null, level: 2 });
    expect(base.map((r) => r.slug)).toEqual(["a"]);
    expect(subclass).toEqual([]);
  });

  it("excludes rows with parent", () => {
    const rows: FeatureRow[] = [
      row({ slug: "parent-choice", name: "Archery", class_slug: "fighter", subclass_slug: null, level: 1, data: { parent: { index: "fighting-style" } } }),
      row({ slug: "real", name: "Second Wind", class_slug: "fighter", subclass_slug: null, level: 1, data: {} })
    ];
    const { base } = selectUnlockedClassFeatures(rows, { classSlug: "fighter", subclassSlug: null, level: 2 });
    expect(base.map((r) => r.slug)).toEqual(["real"]);
  });

  it("includes subclass row when subclass matches", () => {
    const rows: FeatureRow[] = [
      row({
        slug: "frenzy",
        name: "Frenzy",
        class_slug: "barbarian",
        subclass_slug: "berserker",
        level: 3,
        data: { desc: ["Bonus attack"] }
      }),
      row({
        slug: "other-path",
        name: "Other",
        class_slug: "barbarian",
        subclass_slug: "totem-warrior",
        level: 3,
        data: {}
      })
    ];
    const { base, subclass } = selectUnlockedClassFeatures(rows, {
      classSlug: "barbarian",
      subclassSlug: "berserker",
      level: 3
    });
    expect(base).toEqual([]);
    expect(subclass.map((r) => r.slug)).toEqual(["frenzy"]);
  });

  it("maps 2024 catalog subclass index to legacy feature subclass_slug", () => {
    const rows: FeatureRow[] = [
      row({
        slug: "frenzy",
        name: "Frenzy",
        class_slug: "barbarian",
        subclass_slug: "berserker",
        level: 3,
        data: {}
      })
    ];
    const { subclass } = selectUnlockedClassFeatures(rows, {
      classSlug: "barbarian",
      subclassSlug: "path-of-the-berserker",
      level: 3
    });
    expect(subclass.map((r) => r.slug)).toEqual(["frenzy"]);
  });

  it("sorts by level then name", () => {
    const rows: FeatureRow[] = [
      row({ slug: "z", name: "Z", class_slug: "wizard", subclass_slug: null, level: 2, data: {} }),
      row({ slug: "a", name: "A", class_slug: "wizard", subclass_slug: null, level: 1, data: {} }),
      row({ slug: "b", name: "B", class_slug: "wizard", subclass_slug: null, level: 2, data: {} })
    ];
    const { base } = selectUnlockedClassFeatures(rows, { classSlug: "wizard", subclassSlug: null, level: 5 });
    expect(base.map((r) => r.slug)).toEqual(["a", "b", "z"]);
  });
});

describe("buildSheetPassiveEntries", () => {
  it("maps rows to ruleset-class-feature entries with description from data.desc", () => {
    const rows: FeatureRow[] = [
      row({
        slug: "test-feat",
        name: "Test",
        class_slug: "cleric",
        subclass_slug: null,
        level: 1,
        data: { desc: ["First", "Second"] }
      })
    ];
    const c = { classIndex: "cleric", subclassIndex: null, level: 1 } as Character;
    const entries = buildSheetPassiveEntries(c, rows);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      kind: "ruleset-class-feature",
      scope: "base",
      slug: "test-feat",
      name: "Test",
      level: 1,
      description: "First\n\nSecond",
      subclassPathName: null
    });
  });

  it("merges class and subclass by level with base before subclass at same level", () => {
    const rows: FeatureRow[] = [
      row({
        slug: "asi1",
        name: "Ability Score Improvement",
        class_slug: "barbarian",
        subclass_slug: null,
        level: 4,
        data: { desc: ["four"] }
      }),
      row({
        slug: "frenzy",
        name: "Frenzy",
        class_slug: "barbarian",
        subclass_slug: "berserker",
        level: 3,
        data: { desc: ["f"], subclass: { name: "Berserker", index: "berserker" } }
      }),
      row({
        slug: "primal-path",
        name: "Primal Path",
        class_slug: "barbarian",
        subclass_slug: null,
        level: 3,
        data: { desc: ["three"] }
      })
    ];
    const c = { classIndex: "barbarian", subclassIndex: "path-of-the-berserker", level: 4 } as Character;
    const entries = buildSheetPassiveEntries(c, rows);
    expect(entries.map((e) => e.slug)).toEqual(["primal-path", "frenzy", "asi1"]);
    const frenzy = entries.find((e) => e.slug === "frenzy");
    expect(frenzy?.subclassPathName).toBe("Berserker");
  });
});
