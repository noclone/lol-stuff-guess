import { describe, expect, it } from "vitest";
import { HINTS, hintThreshold, itemThreshold } from "./rules";

describe("classic mode", () => {
  it("shows every item right away", () => {
    expect([0, 1, 5].map((i) => itemThreshold("classic", i))).toEqual([0, 0, 0]);
  });

  it("unlocks the first hint after 3 misses, then one per miss", () => {
    expect(HINTS.map((_, h) => hintThreshold("classic", 6, h))).toEqual([3, 4, 5, 6]);
  });
});

describe("challenger mode", () => {
  it("reveals one more item per miss", () => {
    expect([0, 1, 5].map((i) => itemThreshold("challenger", i))).toEqual([0, 1, 5]);
  });

  it("unlocks hints once every item is revealed", () => {
    expect(HINTS.map((_, h) => hintThreshold("challenger", 6, h))).toEqual([6, 7, 8, 9]);
    expect(hintThreshold("challenger", 2, 0)).toBe(2);
  });
});
