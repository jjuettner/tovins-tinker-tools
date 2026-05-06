import { describe, expect, it } from "vitest";
import { parseChallenge, parseHitPoints } from "@/lib/monsterParse";

describe("parseChallenge", () => {
  it("parses integer CR and XP with commas", () => {
    expect(parseChallenge("10 (5,900 XP)")).toEqual({ cr: 10, xp: 5900 });
  });

  it("parses fractional CR", () => {
    expect(parseChallenge("1/8 (25 XP)")).toEqual({ cr: 0.125, xp: 25 });
    expect(parseChallenge("1/4 (50 XP)")).toEqual({ cr: 0.25, xp: 50 });
    expect(parseChallenge("1/2 (100 XP)")).toEqual({ cr: 0.5, xp: 100 });
  });

  it("handles missing XP", () => {
    expect(parseChallenge("5")).toEqual({ cr: 5, xp: 0 });
  });

  it("handles extra spaces", () => {
    expect(parseChallenge("  1/4  ( 50 XP )  ")).toEqual({ cr: 0.25, xp: 50 });
  });
});

describe("parseHitPoints", () => {
  it("parses hp and dice", () => {
    expect(parseHitPoints("135 (18d10 + 36)")).toEqual({ hp: 135, hpDice: "18d10 + 36" });
    expect(parseHitPoints("9 (2d8)")).toEqual({ hp: 9, hpDice: "2d8" });
  });

  it("parses leading number only", () => {
    expect(parseHitPoints("42")).toEqual({ hp: 42, hpDice: null });
  });
});
