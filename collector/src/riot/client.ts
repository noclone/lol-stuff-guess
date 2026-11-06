import type { z } from "zod";
import { type Clock, RateLimiter, type RateWindow, systemClock } from "./rateLimiter";

const MAX_ATTEMPTS = 6;
const DEFAULT_RETRY_AFTER_S = 10;

export class FatalRiotError extends Error {}

export interface RiotClientOptions {
  apiKey: string;
  rateWindows: RateWindow[];
  fetchImpl?: typeof fetch;
  clock?: Clock;
}

export class RiotClient {
  private readonly limiters = new Map<string, RateLimiter>();
  private readonly fetchImpl: typeof fetch;
  private readonly clock: Clock;

  constructor(private readonly options: RiotClientOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.clock = options.clock ?? systemClock;
  }

  async get<T>(
    host: string,
    path: string,
    schema: z.ZodType<T>,
    query: Record<string, string | number> = {},
  ): Promise<T | null> {
    const url = new URL(`https://${host}.api.riotgames.com${path}`);
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, String(value));
    const limiter = this.limiter(host);

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      await limiter.acquire();
      let response: Response;
      try {
        response = await this.fetchImpl(url, {
          headers: { "X-Riot-Token": this.options.apiKey },
        });
      } catch (error) {
        if (attempt === MAX_ATTEMPTS) throw error;
        await this.clock.sleep(backoffMs(attempt));
        continue;
      }

      if (response.ok) return schema.parse(await response.json());
      if (response.status === 404) return null;
      if (response.status === 401 || response.status === 403) {
        const body = await response.text().catch(() => "");
        throw new FatalRiotError(
          `Riot API refused the key on ${url.pathname} (HTTP ${response.status}): ${body}`,
        );
      }
      if (response.status === 429) {
        const retryAfter = Number(response.headers.get("Retry-After")) || DEFAULT_RETRY_AFTER_S;
        limiter.blockFor(retryAfter * 1000);
        continue;
      }
      if (response.status >= 500) {
        await this.clock.sleep(backoffMs(attempt));
        continue;
      }
      throw new Error(`Riot API ${url.pathname} answered HTTP ${response.status}`);
    }
    throw new Error(`Riot API ${url.pathname} still failing after ${MAX_ATTEMPTS} attempts`);
  }

  private limiter(host: string): RateLimiter {
    let limiter = this.limiters.get(host);
    if (!limiter) {
      limiter = new RateLimiter(this.options.rateWindows, this.clock);
      this.limiters.set(host, limiter);
    }
    return limiter;
  }
}

function backoffMs(attempt: number): number {
  return 1000 * 2 ** (attempt - 1);
}
