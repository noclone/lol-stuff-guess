export const MODES = ["classic", "challenger"] as const;
export type Mode = (typeof MODES)[number];

export const HINTS = ["class", "runes", "spells", "skills"] as const;
export type Hint = (typeof HINTS)[number];

export const CLASSIC_FIRST_HINT_MISS = 1;

export function itemThreshold(mode: Mode, itemIndex: number): number {
  return mode === "classic" ? 0 : itemIndex;
}

export function maxAttempts(mode: Mode, itemCount: number): number {
  return hintThreshold(mode, itemCount, HINTS.length - 1) + 2;
}

export function hintThreshold(mode: Mode, itemCount: number, hintIndex: number): number {
  return (mode === "classic" ? CLASSIC_FIRST_HINT_MISS : itemCount) + hintIndex;
}
