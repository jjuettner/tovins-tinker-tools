import { describe, expect, it } from "vitest";
import { readStorage, writeStorage } from "../storage";

describe("storage", () => {
  it("writes then reads typed json", () => {
    localStorage.clear();

    writeStorage("k", { n: 1 });
    const value = readStorage<{ n: number }>("k");

    expect(value).toEqual({ n: 1 });
  });
});

