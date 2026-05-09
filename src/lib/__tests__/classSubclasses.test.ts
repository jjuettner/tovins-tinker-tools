import { describe, expect, it } from "vitest";
import { subclassesFromClassData } from "@/lib/ruleset/classSubclasses";

describe("subclassesFromClassData", () => {
  it("returns undefined when missing", () => {
    expect(subclassesFromClassData(null)).toBeUndefined();
    expect(subclassesFromClassData({})).toBeUndefined();
  });

  it("parses and sorts by name", () => {
    const out = subclassesFromClassData({
      subclasses: [
        { index: "z-path", name: "Zebra Path" },
        { index: "a-path", name: "Alpha Path" }
      ]
    });
    expect(out?.map((x) => x.index)).toEqual(["a-path", "z-path"]);
  });
});
