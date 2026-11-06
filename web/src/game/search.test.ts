import { describe, expect, it } from "vitest";
import { normalize, searchChampions } from "./search";

const champions = [
  { key: 1, name: "Kai'Sa" },
  { key: 2, name: "Kassadin" },
  { key: 3, name: "Nocturne" },
  { key: 4, name: "Nunu & Willump" },
  { key: 5, name: "Kha'Zix" },
];

describe("normalize", () => {
  it("drops accents, case and punctuation", () => {
    expect(normalize("Kai'Sa")).toBe("kaisa");
    expect(normalize("Électre & Co")).toBe("electreco");
  });
});

describe("searchChampions", () => {
  it("lists prefix matches before inner matches", () => {
    expect(searchChampions(champions, "ka", new Set()).map((c) => c.key)).toEqual([1, 2]);
    expect(searchChampions(champions, "u", new Set()).map((c) => c.key)).toEqual([3, 4]);
  });

  it("matches without punctuation and skips excluded champions", () => {
    expect(searchChampions(champions, "khaz", new Set()).map((c) => c.key)).toEqual([5]);
    expect(searchChampions(champions, "ka", new Set([1])).map((c) => c.key)).toEqual([2]);
  });

  it("returns nothing for an empty query", () => {
    expect(searchChampions(champions, " ' ", new Set())).toEqual([]);
  });
});
