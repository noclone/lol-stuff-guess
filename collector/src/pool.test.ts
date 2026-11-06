import type { Game } from "@lsg/shared";
import { describe, expect, it } from "vitest";
import { keepRecentPatches, mergeGames } from "./pool";

function game(matchId: string, overrides: Partial<Game> = {}): Game {
  return {
    matchId,
    platform: "euw1",
    tier: "GOLD",
    patch: "16.22",
    ddragonVersion: "16.22.1",
    durationSeconds: 1_650,
    playedAt: 0,
    players: [],
    ...overrides,
  };
}

describe("mergeGames", () => {
  it("deduplicates by match id, keeping the fresh copy", () => {
    const merged = mergeGames([game("A", { tier: "IRON" }), game("B")], [game("A"), game("C")]);
    expect(merged.map((g) => [g.matchId, g.tier])).toEqual([
      ["A", "GOLD"],
      ["B", "GOLD"],
      ["C", "GOLD"],
    ]);
  });
});

describe("keepRecentPatches", () => {
  it("keeps the most recent patches only", () => {
    const games = ["16.9", "16.10", "16.8", "16.10", "15.24"].map((patch, i) =>
      game(String(i), { patch }),
    );
    expect(keepRecentPatches(games, 2).map((g) => g.patch)).toEqual(["16.9", "16.10", "16.10"]);
  });
});
