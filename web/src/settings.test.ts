import { describe, expect, it } from "vitest";
import { defaultSettings, parseSettings } from "./settings";

describe("parseSettings", () => {
  it("falls back to defaults on missing or broken data", () => {
    expect(parseSettings(null)).toEqual(defaultSettings());
    expect(parseSettings("{oops")).toEqual(defaultSettings());
  });

  it("keeps valid values and drops unknown ones", () => {
    const settings = parseSettings(
      JSON.stringify({
        mode: "challenger",
        filters: { platforms: ["kr", "mars1", "euw1"], tiers: ["GOLD"], durations: "nope" },
      }),
    );
    expect(settings.mode).toBe("challenger");
    expect(settings.filters.platforms).toEqual(["euw1", "kr"]);
    expect(settings.filters.tiers).toEqual(["GOLD"]);
    expect(settings.filters.durations).toEqual(defaultSettings().filters.durations);
  });

  it("rejects unknown modes", () => {
    expect(parseSettings(JSON.stringify({ mode: "hardcore" })).mode).toBe("classic");
  });
});
