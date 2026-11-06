import { type Game, type Player, TIERS, type Tier } from "@lsg/shared";
import { describe, expect, it } from "vitest";
import { ensureDailies, pickDaily, utcDate } from "./daily";

function player(championId: number, itemCount = 6): Player {
  return {
    championId,
    items: Array.from({ length: itemCount }, (_, i) => 3000 + i),
    spells: [4, 14],
    runes: {
      primaryTree: 8000,
      primary: [8008, 9111, 9104, 8014],
      secondaryTree: 8100,
      secondary: [8139, 8135],
      shards: { offense: 5005, flex: 5008, defense: 5011 },
    },
    skills: [1, 2, 3],
    position: null,
    kills: 0,
    deaths: 0,
    assists: 0,
    cs: 0,
    win: true,
  };
}

function game(matchId: string, tier: Tier, players: Player[], durationSeconds = 1_800): Game {
  return {
    matchId,
    platform: "euw1",
    tier,
    patch: "16.22",
    ddragonVersion: "16.22.1",
    durationSeconds,
    playedAt: 0,
    players,
  };
}

function fullPool(gamesPerTier: number): Game[] {
  return TIERS.flatMap((tier, t) =>
    Array.from({ length: gamesPerTier }, (_, g) =>
      game(
        `${tier}_${g}`,
        tier,
        Array.from({ length: 10 }, (_, p) => player(1 + ((t * 7 + g * 3 + p) % 60))),
      ),
    ),
  );
}

const firstPick = () => 0;

describe("utcDate", () => {
  it("formats UTC dates with an offset", () => {
    const now = new Date("2026-11-06T23:30:00Z");
    expect(utcDate(now)).toBe("2026-11-06");
    expect(utcDate(now, -1)).toBe("2026-11-05");
    expect(utcDate(now, 2)).toBe("2026-11-08");
  });
});

describe("pickDaily", () => {
  it("picks one round per tier, from Iron to Challenger, without repeating champions", () => {
    const daily = pickDaily("2026-11-06", fullPool(2), new Set(), Math.random);
    expect(daily.date).toBe("2026-11-06");
    expect(daily.rounds.map((round) => round.tier)).toEqual([...TIERS]);
    const champions = daily.rounds.map((round) => round.player.championId);
    expect(new Set(champions).size).toBe(TIERS.length);
    expect(daily.rounds[0]).not.toHaveProperty("players");
  });

  it("prefers full builds from games of at least 15 minutes", () => {
    const games = fullPool(1).map((g) =>
      g.tier === "IRON" ? game("IRON_short", "IRON", [player(100, 6)], 600) : g,
    );
    games.push(game("IRON_thin", "IRON", [player(101, 2)]));
    games.push(game("IRON_good", "IRON", [player(102, 5)]));
    const daily = pickDaily("2026-11-06", games, new Set(), firstPick);
    expect(daily.rounds[0]?.matchId).toBe("IRON_good");
  });

  it("falls back to any build, then fails loudly when a tier is empty", () => {
    const thinOnly = fullPool(1).map((g) =>
      g.tier === "IRON" ? game("IRON_thin", "IRON", [player(101, 2)]) : g,
    );
    expect(pickDaily("2026-11-06", thinOnly, new Set(), firstPick).rounds[0]?.matchId).toBe(
      "IRON_thin",
    );
    const noIron = fullPool(1).filter((g) => g.tier !== "IRON");
    expect(() => pickDaily("2026-11-06", noIron, new Set(), firstPick)).toThrow(/IRON/);
  });

  it("skips games already used by other dailies", () => {
    const games = fullPool(2);
    const daily = pickDaily("2026-11-06", games, new Set(["IRON_0"]), firstPick);
    expect(daily.rounds[0]?.matchId).toBe("IRON_1");
  });
});

describe("ensureDailies", () => {
  const today = new Date("2026-11-06T04:00:00Z");

  it("creates the dailies from yesterday to the day after tomorrow", () => {
    const dailies = ensureDailies({}, fullPool(5), today, 30, Math.random);
    expect(Object.keys(dailies).sort()).toEqual([
      "2026-11-05",
      "2026-11-06",
      "2026-11-07",
      "2026-11-08",
    ]);
    const matchIds = Object.values(dailies).flatMap((d) => d.rounds.map((r) => r.matchId));
    expect(new Set(matchIds).size).toBe(matchIds.length);
  });

  it("never changes an existing daily and drops the expired ones", () => {
    const first = ensureDailies({}, fullPool(5), today, 30, Math.random);
    const old = { ...first["2026-11-06"], date: "2026-09-01" } as (typeof first)[string];
    const next = ensureDailies(
      { ...first, "2026-09-01": old },
      fullPool(5),
      new Date("2026-11-07T04:00:00Z"),
      30,
      Math.random,
    );
    expect(next["2026-11-06"]).toEqual(first["2026-11-06"]);
    expect(next["2026-11-08"]).toEqual(first["2026-11-08"]);
    expect(next["2026-11-09"]).toBeDefined();
    expect(next["2026-09-01"]).toBeUndefined();
  });
});
