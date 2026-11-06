export interface RateWindow {
  limit: number;
  ms: number;
}

export interface Clock {
  now(): number;
  sleep(ms: number): Promise<void>;
}

export const systemClock: Clock = {
  now: () => Date.now(),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

const SAFETY_MARGIN_MS = 100;

export function parseRateWindows(spec: string): RateWindow[] {
  return spec.split(",").map((part) => {
    const [limit, seconds] = part.split(":").map(Number);
    if (!limit || !seconds || limit <= 0 || seconds <= 0) {
      throw new Error(`Invalid rate limit "${part}", expected <requests>:<seconds>`);
    }
    return { limit, ms: seconds * 1000 };
  });
}

export class RateLimiter {
  private readonly stamps: number[] = [];
  private readonly longestWindowMs: number;
  private blockedUntil = 0;
  private queue: Promise<void> = Promise.resolve();

  constructor(
    private readonly windows: RateWindow[],
    private readonly clock: Clock = systemClock,
  ) {
    this.longestWindowMs = Math.max(...windows.map((w) => w.ms));
  }

  acquire(): Promise<void> {
    const slot = this.queue.then(() => this.waitForSlot());
    this.queue = slot.catch(() => undefined);
    return slot;
  }

  blockFor(ms: number): void {
    this.blockedUntil = Math.max(this.blockedUntil, this.clock.now() + ms);
  }

  private async waitForSlot(): Promise<void> {
    for (;;) {
      const now = this.clock.now();
      const wait = Math.max(
        this.blockedUntil - now,
        ...this.windows.map((w) => this.waitFor(w, now)),
      );
      if (wait <= 0) {
        this.stamps.push(now);
        this.prune(now);
        return;
      }
      await this.clock.sleep(wait);
    }
  }

  private waitFor(window: RateWindow, now: number): number {
    const recent = this.stamps.filter((t) => t > now - window.ms - SAFETY_MARGIN_MS);
    if (recent.length < window.limit) return 0;
    const blocking = recent[recent.length - window.limit] ?? now;
    return blocking + window.ms + SAFETY_MARGIN_MS - now;
  }

  private prune(now: number): void {
    const horizon = now - this.longestWindowMs - SAFETY_MARGIN_MS;
    while (this.stamps.length > 0 && (this.stamps[0] ?? now) <= horizon) this.stamps.shift();
  }
}
