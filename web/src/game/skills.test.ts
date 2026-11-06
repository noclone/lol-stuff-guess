import { describe, expect, it } from "vitest";
import { skillPriority } from "./skills";

describe("skillPriority", () => {
  it("orders basic abilities by points, then by who reached that count first", () => {
    const skills = [3, 2, 1, 2, 2, 4, 2, 1, 1, 2, 4, 3, 3, 3, 3, 4];
    expect(skillPriority(skills)).toEqual([2, 3, 1]);
  });

  it("breaks ties on the ability maxed first", () => {
    expect(skillPriority([1, 3, 1, 3, 1, 3])).toEqual([1, 3]);
    expect(skillPriority([3, 1, 3, 1])).toEqual([3, 1]);
  });

  it("ignores the ultimate and handles empty games", () => {
    expect(skillPriority([4, 4, 1])).toEqual([1]);
    expect(skillPriority([])).toEqual([]);
  });
});
