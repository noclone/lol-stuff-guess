import { parseArgs } from "node:util";
import { type Game, PLATFORMS, TIERS } from "@lsg/shared";
import { type CollectContext, collectPlatform } from "./collect";
import { cachedItemOrigins, fetchDdragonVersions } from "./ddragon";
import { keepRecentPatches, loadPreviousGames, mergeGames, writePool } from "./pool";
import { RiotApi } from "./riot/api";
import { RiotClient } from "./riot/client";
import { parseRateWindows } from "./riot/rateLimiter";

const { values } = parseArgs({
  options: {
    out: { type: "string" },
    previous: { type: "string" },
    games: { type: "string", default: "1500" },
    platforms: { type: "string", default: PLATFORMS.join(",") },
    tiers: { type: "string", default: TIERS.join(",") },
    "keep-patches": { type: "string", default: "3" },
    "max-age-days": { type: "string", default: "14" },
    "rate-limits": { type: "string", default: "20:1,100:120" },
  },
});

async function main(): Promise<void> {
  const outDir = required(values.out, "--out");
  const platforms = parseList(values.platforms, PLATFORMS, "--platforms");
  const tiers = parseList(values.tiers, TIERS, "--tiers");
  const totalGames = parsePositiveInt(values.games, "--games", true);
  const keepPatches = parsePositiveInt(values["keep-patches"], "--keep-patches");
  const maxAgeDays = parsePositiveInt(values["max-age-days"], "--max-age-days");

  const previous = values.previous ? await loadPreviousGames(values.previous) : [];
  log(`previous pool: ${previous.length} games`);

  let fresh: Game[] = [];
  if (totalGames > 0) {
    const apiKey = process.env.RIOT_API_KEY;
    if (!apiKey) throw new Error("RIOT_API_KEY environment variable is required");
    const client = new RiotClient({ apiKey, rateWindows: parseRateWindows(values["rate-limits"]) });
    const ctx: CollectContext = {
      api: new RiotApi(client),
      ddragonVersions: await fetchDdragonVersions(),
      itemOrigins: cachedItemOrigins(),
      seenMatchIds: new Set(previous.map((game) => game.matchId)),
      since: new Date(Date.now() - maxAgeDays * 24 * 3600 * 1000),
      rng: Math.random,
      log,
    };
    const gamesPerTier = Math.max(1, Math.ceil(totalGames / (platforms.length * tiers.length)));
    const perPlatform = await Promise.all(
      platforms.map((platform) => collectPlatform(ctx, platform, tiers, gamesPerTier)),
    );
    fresh = perPlatform.flat();
    log(`collected ${fresh.length} new games`);
  }

  const games = keepRecentPatches(mergeGames(previous, fresh), keepPatches);
  const index = await writePool(outDir, games, new Date());
  const rounds = index.shards.reduce((sum, shard) => sum + shard.rounds, 0);
  log(`pool: ${games.length} games, ${rounds} rounds, patches ${index.patches.join(", ")}`);
}

function required(value: string | undefined, flag: string): string {
  if (!value) throw new Error(`${flag} is required`);
  return value;
}

function parsePositiveInt(value: string | undefined, flag: string, allowZero = false): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < (allowZero ? 0 : 1)) {
    throw new Error(`${flag} must be a ${allowZero ? "non-negative" : "positive"} integer`);
  }
  return parsed;
}

function parseList<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  flag: string,
): T[] {
  const items = (value ?? "").split(",").filter(Boolean);
  const invalid = items.filter((item) => !(allowed as readonly string[]).includes(item));
  if (items.length === 0 || invalid.length > 0) {
    throw new Error(`${flag} accepts a comma-separated subset of: ${allowed.join(",")}`);
  }
  return items as T[];
}

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
