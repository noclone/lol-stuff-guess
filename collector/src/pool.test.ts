import type { Game, Player } from "@lsg/shared";
import { describe, expect, it } from "vitest";
import { buildShards, keepRecentPatches, mergeGames } from "./pool";

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

const player: Player = {
  championId: 1,
  items: [3006],
  spells: [4, 14],
  keystone: 8008,
  secondaryTree: 8100,
  position: null,
  kills: 0,
  deaths: 0,
  assists: 0,
  cs: 0,
  win: true,
};

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

describe("buildShards", () => {
  it("groups games by platform, tier and duration and counts rounds", () => {
    const games = [
      game("A", { players: [player, player] }),
      game("B", { players: [player] }),
      game("C", { durationSeconds: 900, players: [player] }),
      game("D", { platform: "kr", patch: "16.21", players: [player] }),
    ];
    const { index, shards } = buildShards(games, new Date(42));
    expect(index.generatedAt).toBe(42);
    expect(index.patches).toEqual(["16.22", "16.21"]);
    expect(index.shards).toEqual([
      {
        platform: "euw1",
        tier: "GOLD",
        duration: "25-30",
        rounds: 3,
        path: "shards/euw1/GOLD/25-30.json",
      },
      {
        platform: "euw1",
        tier: "GOLD",
        duration: "lt20",
        rounds: 1,
        path: "shards/euw1/GOLD/lt20.json",
      },
      {
        platform: "kr",
        tier: "GOLD",
        duration: "25-30",
        rounds: 1,
        path: "shards/kr/GOLD/25-30.json",
      },
    ]);
    expect(shards.get("shards/euw1/GOLD/25-30.json")?.map((g) => g.matchId)).toEqual(["A", "B"]);
  });
});
