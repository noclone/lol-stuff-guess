import { describe, expect, it } from "vitest";
import { HINTS, hintThreshold, itemThreshold, maxAttempts } from "./rules";

describe("classic mode", () => {
  it("shows every item right away", () => {
    expect([0, 1, 5].map((i) => itemThreshold("classic", i))).toEqual([0, 0, 0]);
  });

  it("unlocks the first hint after the first miss, then one per miss", () => {
    expect(HINTS.map((_, h) => hintThreshold("classic", 6, h))).toEqual([1, 2, 3, 4]);
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

describe("maxAttempts", () => {
  it("leaves two guesses once everything is revealed", () => {
    expect(maxAttempts("classic", 6)).toBe(6);
    expect(maxAttempts("challenger", 6)).toBe(11);
    expect(maxAttempts("challenger", 4)).toBe(9);
  });
});
