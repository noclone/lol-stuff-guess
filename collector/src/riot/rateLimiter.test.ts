import { describe, expect, it } from "vitest";
import { type Clock, parseRateWindows, RateLimiter } from "./rateLimiter";

function fakeClock(): Clock & { time: number } {
  const clock = {
    time: 0,
    now: () => clock.time,
    sleep: async (ms: number) => {
      clock.time += ms;
    },
  };
  return clock;
}

describe("parseRateWindows", () => {
  it("parses requests:seconds pairs", () => {
    expect(parseRateWindows("20:1,100:120")).toEqual([
      { limit: 20, ms: 1_000 },
      { limit: 100, ms: 120_000 },
    ]);
  });

  it("rejects malformed specs", () => {
    expect(() => parseRateWindows("20")).toThrow();
    expect(() => parseRateWindows("0:1")).toThrow();
  });
});

describe("RateLimiter", () => {
  it("never exceeds any window", async () => {
    const clock = fakeClock();
    const limiter = new RateLimiter(parseRateWindows("3:1,5:10"), clock);
    const stamps: number[] = [];
    for (let i = 0; i < 12; i++) {
      await limiter.acquire();
      stamps.push(clock.time);
    }
    const windows: [number, number][] = [
      [3, 1_000],
      [5, 10_000],
    ];
    for (const [limit, ms] of windows) {
      for (const t of stamps) {
        expect(stamps.filter((s) => s >= t && s < t + ms).length).toBeLessThanOrEqual(limit);
      }
    }
    expect(stamps.slice(0, 3)).toEqual([0, 0, 0]);
  });

  it("waits out an explicit block", async () => {
    const clock = fakeClock();
    const limiter = new RateLimiter(parseRateWindows("100:1"), clock);
    limiter.blockFor(5_000);
    await limiter.acquire();
    expect(clock.time).toBe(5_000);
  });
});
