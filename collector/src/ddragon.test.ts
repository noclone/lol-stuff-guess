import { describe, expect, it } from "vitest";
import { parseItemOrigins } from "./ddragon";

describe("parseItemOrigins", () => {
  it("maps transformed items and single-component upgrades to their origin", () => {
    const origins = parseItemOrigins({
      data: {
        "3042": { specialRecipe: 3004 },
        "3175": { from: ["3020"] },
        "3089": { from: ["1058", "1026"] },
        "3006": { from: ["1001", "1042"] },
        "2150": {},
      },
    });
    expect(Object.fromEntries(origins)).toEqual({ 3042: 3004, 3175: 3020 });
  });
});
