import type { Daily } from "@lsg/shared";
import { describe, expect, it } from "vitest";
import {
  applyGuess,
  attemptsUsed,
  firstUnfinished,
  giveUp,
  newProgress,
  parseProgress,
  type RoundProgress,
  shareText,
} from "./progress";

const daily = { date: "2026-11-06", rounds: [{}, {}, {}] } as unknown as Daily;
const playing: RoundProgress = { misses: [], status: "playing" };

describe("applyGuess", () => {
  it("wins on the right champion", () => {
    expect(applyGuess(playing, 7, 7, 6)).toEqual({ misses: [], status: "won" });
  });

  it("records misses and loses once attempts are exhausted", () => {
    let round = playing;
    for (const key of [1, 2]) round = applyGuess(round, key, 7, 3);
    expect(round).toEqual({ misses: [1, 2], status: "playing" });
    expect(applyGuess(round, 3, 7, 3)).toEqual({ misses: [1, 2, 3], status: "lost" });
  });

  it("ignores repeated guesses and finished rounds", () => {
    const round = applyGuess(playing, 1, 7, 6);
    expect(applyGuess(round, 1, 7, 6)).toBe(round);
    const won = applyGuess(round, 7, 7, 6);
    expect(applyGuess(won, 2, 7, 6)).toBe(won);
  });
});

describe("round helpers", () => {
  it("counts attempts and gives up", () => {
    expect(attemptsUsed({ misses: [1, 2], status: "won" })).toBe(3);
    expect(attemptsUsed({ misses: [1, 2], status: "lost" })).toBe(2);
    expect(giveUp(playing).status).toBe("lost");
  });

  it("finds the first unfinished round", () => {
    const progress = newProgress(daily, "classic");
    expect(firstUnfinished(progress)).toBe(0);
    progress.rounds = progress.rounds.map(() => ({ misses: [], status: "won" }));
    expect(firstUnfinished(progress)).toBe(-1);
  });
});

describe("parseProgress", () => {
  it("restores a valid progress for the same daily", () => {
    const progress = newProgress(daily, "challenger");
    expect(parseProgress(JSON.stringify(progress), daily)).toEqual(progress);
  });

  it("rejects another date, a broken shape or garbage", () => {
    const other = { ...newProgress(daily, "classic"), date: "2026-11-05" };
    expect(parseProgress(JSON.stringify(other), daily)).toBeNull();
    const short = { ...newProgress(daily, "classic"), rounds: [] };
    expect(parseProgress(JSON.stringify(short), daily)).toBeNull();
    expect(parseProgress("{oops", daily)).toBeNull();
    expect(parseProgress(null, daily)).toBeNull();
  });
});

describe("shareText", () => {
  it("summarises the daily with one square per rank", () => {
    const progress = {
      date: "2026-11-06",
      mode: "classic" as const,
      rounds: [
        { misses: [], status: "won" as const },
        { misses: [1, 2], status: "won" as const },
        { misses: [1, 2, 3, 4, 5, 6], status: "lost" as const },
      ],
    };
    expect(shareText(progress, "Classique", "https://example.test/")).toBe(
      "LoL Stuff Guess 2026-11-06 · Classique\n🟩🟨🟥 2/3\nhttps://example.test/",
    );
  });
});
