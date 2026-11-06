import type { Daily } from "@lsg/shared";
import { MODES, type Mode } from "./rules";

const STORAGE_PREFIX = "lsg.daily.";

export type RoundStatus = "playing" | "won" | "lost";

export interface RoundProgress {
  misses: number[];
  status: RoundStatus;
}

export interface DailyProgress {
  date: string;
  mode: Mode;
  rounds: RoundProgress[];
}

export function newProgress(daily: Daily, mode: Mode): DailyProgress {
  return {
    date: daily.date,
    mode,
    rounds: daily.rounds.map(() => ({ misses: [], status: "playing" })),
  };
}

export function applyGuess(
  round: RoundProgress,
  guessKey: number,
  answerKey: number,
  maxAttempts: number,
): RoundProgress {
  if (round.status !== "playing" || round.misses.includes(guessKey)) return round;
  if (guessKey === answerKey) return { ...round, status: "won" };
  const misses = [...round.misses, guessKey];
  return { misses, status: misses.length >= maxAttempts ? "lost" : "playing" };
}

export function giveUp(round: RoundProgress): RoundProgress {
  return round.status === "playing" ? { ...round, status: "lost" } : round;
}

export function attemptsUsed(round: RoundProgress): number {
  return round.misses.length + (round.status === "won" ? 1 : 0);
}

export function firstUnfinished(progress: DailyProgress): number {
  return progress.rounds.findIndex((round) => round.status === "playing");
}

export function parseProgress(raw: string | null, daily: Daily): DailyProgress | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<DailyProgress>;
    const mode = MODES.find((m) => m === parsed.mode);
    const rounds = parsed.rounds;
    if (
      parsed.date !== daily.date ||
      !mode ||
      !Array.isArray(rounds) ||
      rounds.length !== daily.rounds.length ||
      !rounds.every(
        (r) =>
          Array.isArray(r?.misses) &&
          r.misses.every((key) => typeof key === "number") &&
          ["playing", "won", "lost"].includes(r.status),
      )
    ) {
      return null;
    }
    return { date: daily.date, mode, rounds };
  } catch {
    return null;
  }
}

export function loadProgress(daily: Daily): DailyProgress | null {
  return parseProgress(localStorage.getItem(STORAGE_PREFIX + daily.date), daily);
}

export function saveProgress(progress: DailyProgress): void {
  localStorage.setItem(STORAGE_PREFIX + progress.date, JSON.stringify(progress));
}

export function resultEmoji(round: RoundProgress): string {
  if (round.status !== "won") return "🟥";
  const attempts = attemptsUsed(round);
  if (attempts === 1) return "🟩";
  if (attempts <= 3) return "🟨";
  return "🟧";
}

export function shareText(progress: DailyProgress, modeLabel: string, url: string): string {
  const found = progress.rounds.filter((round) => round.status === "won").length;
  const grid = progress.rounds.map(resultEmoji).join("");
  return `LoL Stuff Guess ${progress.date} · ${modeLabel}\n${grid} ${found}/${progress.rounds.length}\n${url}`;
}
