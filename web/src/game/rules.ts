export const MODES = ["classic", "challenger"] as const;
export type Mode = (typeof MODES)[number];

export const HINTS = ["spells", "runes", "role", "stats"] as const;
export type Hint = (typeof HINTS)[number];

export const CLASSIC_FREE_MISSES = 3;

export function itemThreshold(mode: Mode, itemIndex: number): number {
  return mode === "classic" ? 0 : itemIndex;
}

export function hintThreshold(mode: Mode, itemCount: number, hintIndex: number): number {
  return (mode === "classic" ? CLASSIC_FREE_MISSES : itemCount) + hintIndex;
}
