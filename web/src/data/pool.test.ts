import type { Game, Player, PoolIndex, ShardRef } from "@lsg/shared";
import { describe, expect, it } from "vitest";
import { matchingShards, pickWeighted, roundAt } from "./pool";

function shard(overrides: Partial<ShardRef>): ShardRef {
  return {
    platform: "euw1",
    tier: "GOLD",
    duration: "25-30",
    rounds: 10,
    path: "x.json",
    ...overrides,
  };
}

const player = (championId: number): Player => ({
  championId,
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
});

const game = (matchId: string, champions: number[]): Game => ({
  matchId,
  platform: "euw1",
  tier: "GOLD",
  patch: "16.22",
  ddragonVersion: "16.22.1",
  durationSeconds: 1_650,
  playedAt: 0,
  players: champions.map(player),
});

describe("matchingShards", () => {
  it("keeps shards matching every filter", () => {
    const index: PoolIndex = {
      generatedAt: 0,
      patches: [],
      shards: [
        shard({ path: "a" }),
        shard({ path: "b", platform: "kr" }),
        shard({ path: "c", tier: "IRON" }),
        shard({ path: "d", duration: "lt20" }),
        shard({ path: "e", rounds: 0 }),
      ],
    };
    const filters = {
      platforms: ["euw1" as const],
      tiers: ["GOLD" as const],
      durations: ["25-30" as const],
    };
    expect(matchingShards(index, filters).map((s) => s.path)).toEqual(["a"]);
  });
});

describe("pickWeighted", () => {
  const shards = [shard({ path: "a", rounds: 1 }), shard({ path: "b", rounds: 3 })];

  it("picks proportionally to the number of rounds", () => {
    expect(pickWeighted(shards, 0)?.path).toBe("a");
    expect(pickWeighted(shards, 0.24)?.path).toBe("a");
    expect(pickWeighted(shards, 0.25)?.path).toBe("b");
    expect(pickWeighted(shards, 0.999)?.path).toBe("b");
  });

  it("returns null without shards", () => {
    expect(pickWeighted([], 0.5)).toBeNull();
  });
});

describe("roundAt", () => {
  it("flattens players across games", () => {
    const games = [game("A", [1, 2]), game("B", [3, 4, 5])];
    expect(roundAt(games, 1)?.key).toBe("A:1");
    expect(roundAt(games, 2)?.player.championId).toBe(3);
    expect(roundAt(games, 4)?.key).toBe("B:2");
    expect(roundAt(games, 5)).toBeNull();
  });
});
