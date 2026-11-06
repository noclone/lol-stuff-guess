import type { Game, Platform, Tier } from "@lsg/shared";
import type { ItemOrigins } from "./ddragon";
import { buildGame, isPlayable, matchDdragonVersion } from "./game";
import { DIVISIONS, isApexTier, type RiotApi } from "./riot/api";
import { FatalRiotError } from "./riot/client";

const INITIAL_MAX_PAGE = 100;
const MATCHES_PER_PLAYER = 2;
const PLAYER_ATTEMPTS_PER_GAME = 6;

export type Rng = () => number;

export interface CollectContext {
  api: RiotApi;
  ddragonVersions: string[];
  itemOrigins: (ddragonVersion: string) => Promise<ItemOrigins>;
  seenMatchIds: Set<string>;
  since: Date;
  rng: Rng;
  log: (message: string) => void;
}

export async function collectPlatform(
  ctx: CollectContext,
  platform: Platform,
  tiers: readonly Tier[],
  gamesPerTier: number,
): Promise<Game[]> {
  const sampler = new PlayerSampler(ctx.api, platform, ctx.rng);
  const games: Game[] = [];
  for (const tier of tiers) {
    const tierGames = await collectBucket(ctx, sampler, platform, tier, gamesPerTier);
    ctx.log(`${platform} ${tier}: ${tierGames.length}/${gamesPerTier} games`);
    games.push(...tierGames);
  }
  return games;
}

async function collectBucket(
  ctx: CollectContext,
  sampler: PlayerSampler,
  platform: Platform,
  tier: Tier,
  target: number,
): Promise<Game[]> {
  const games: Game[] = [];
  for (
    let attempt = 0;
    attempt < target * PLAYER_ATTEMPTS_PER_GAME && games.length < target;
    attempt++
  ) {
    try {
      const puuid = await sampler.randomPuuid(tier);
      if (!puuid) break;
      const matchIds = await ctx.api.rankedMatchIds(platform, puuid, ctx.since);
      const fresh = shuffle(
        matchIds.filter((id) => !ctx.seenMatchIds.has(id)),
        ctx.rng,
      ).slice(0, MATCHES_PER_PLAYER);
      for (const matchId of fresh) {
        if (games.length >= target) break;
        ctx.seenMatchIds.add(matchId);
        const game = await fetchGame(ctx, platform, tier, matchId);
        if (game) games.push(game);
      }
    } catch (error) {
      if (error instanceof FatalRiotError) throw error;
      ctx.log(`${platform} ${tier}: skipped after error: ${(error as Error).message}`);
    }
  }
  return games;
}

async function fetchGame(
  ctx: CollectContext,
  platform: Platform,
  tier: Tier,
  matchId: string,
): Promise<Game | null> {
  const match = await ctx.api.match(platform, matchId);
  if (!match || !isPlayable(match)) return null;
  const ddragonVersion = matchDdragonVersion(match, ctx.ddragonVersions);
  if (!ddragonVersion) return null;
  const timeline = await ctx.api.timeline(platform, matchId);
  if (!timeline) return null;
  const itemOrigins = await ctx.itemOrigins(ddragonVersion);
  return buildGame(match, timeline, platform, tier, ddragonVersion, itemOrigins);
}

class PlayerSampler {
  private readonly apexPuuids = new Map<Tier, string[]>();
  private readonly maxPages = new Map<string, number>();

  constructor(
    private readonly api: RiotApi,
    private readonly platform: Platform,
    private readonly rng: Rng,
  ) {}

  async randomPuuid(tier: Tier): Promise<string | null> {
    if (isApexTier(tier)) {
      let puuids = this.apexPuuids.get(tier);
      if (!puuids) {
        puuids = await this.api.apexPuuids(this.platform, tier);
        this.apexPuuids.set(tier, puuids);
      }
      return pick(puuids, this.rng);
    }

    for (const division of shuffle([...DIVISIONS], this.rng)) {
      const key = `${tier}/${division}`;
      for (;;) {
        const maxPage = this.maxPages.get(key) ?? INITIAL_MAX_PAGE;
        if (maxPage < 1) break;
        const page = 1 + Math.floor(this.rng() * maxPage);
        const puuids = await this.api.leaguePagePuuids(this.platform, tier, division, page);
        if (puuids.length > 0) return pick(puuids, this.rng);
        this.maxPages.set(key, page - 1);
      }
    }
    return null;
  }
}

function pick<T>(values: readonly T[], rng: Rng): T | null {
  if (values.length === 0) return null;
  return values[Math.floor(rng() * values.length)] ?? null;
}

function shuffle<T>(values: T[], rng: Rng): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }
  return result;
}
