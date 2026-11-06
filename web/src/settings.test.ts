import { describe, expect, it } from "vitest";
import { parseMode } from "./settings";

describe("parseMode", () => {
  it("keeps known modes and defaults to classic", () => {
    expect(parseMode("challenger")).toBe("challenger");
    expect(parseMode("hardcore")).toBe("classic");
    expect(parseMode(null)).toBe("classic");
  });
});
