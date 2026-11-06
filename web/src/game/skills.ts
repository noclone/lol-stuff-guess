export const SKILL_KEYS = ["Q", "W", "E", "R"] as const;

const BASIC_SLOTS = [1, 2, 3];

export function skillPriority(skills: readonly number[]): number[] {
  const points = new Map<number, number>();
  const reachedAt = new Map<number, number>();
  skills.forEach((slot, index) => {
    points.set(slot, (points.get(slot) ?? 0) + 1);
    reachedAt.set(slot, index);
  });
  return BASIC_SLOTS.filter((slot) => points.has(slot)).sort(
    (a, b) =>
      (points.get(b) ?? 0) - (points.get(a) ?? 0) ||
      (reachedAt.get(a) ?? 0) - (reachedAt.get(b) ?? 0),
  );
}
