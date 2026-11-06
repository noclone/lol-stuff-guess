import {
  type DurationBucket,
  type Game,
  INDEX_FILE,
  type Platform,
  type Player,
  type PoolIndex,
  type ShardRef,
  type Tier,
} from "@lsg/shared";

const DATA_BASE = "./data/";
const DRAW_ATTEMPTS = 10;

export interface Filters {
  platforms: Platform[];
  tiers: Tier[];
  durations: DurationBucket[];
}

export interface Round {
  key: string;
  game: Game;
  player: Player;
}

export function matchingShards(index: PoolIndex, filters: Filters): ShardRef[] {
  return index.shards.filter(
    (shard) =>
      shard.rounds > 0 &&
      filters.platforms.includes(shard.platform) &&
      filters.tiers.includes(shard.tier) &&
      filters.durations.includes(shard.duration),
  );
}

export function pickWeighted(shards: readonly ShardRef[], fraction: number): ShardRef | null {
  const total = shards.reduce((sum, shard) => sum + shard.rounds, 0);
  let remaining = fraction * total;
  for (const shard of shards) {
    if (remaining < shard.rounds) return shard;
    remaining -= shard.rounds;
  }
  return shards.at(-1) ?? null;
}

export function roundAt(games: readonly Game[], position: number): Round | null {
  let remaining = position;
  for (const game of games) {
    const player = game.players[remaining];
    if (player) return { key: `${game.matchId}:${remaining}`, game, player };
    remaining -= game.players.length;
  }
  return null;
}

let indexPromise: Promise<PoolIndex> | null = null;
const shardPromises = new Map<string, Promise<Game[]>>();

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${DATA_BASE}${path}`);
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return (await response.json()) as T;
}

export function loadIndex(): Promise<PoolIndex> {
  indexPromise ??= fetchJson<PoolIndex>(INDEX_FILE).catch((error: unknown) => {
    indexPromise = null;
    throw error;
  });
  return indexPromise;
}

function loadShard(path: string): Promise<Game[]> {
  let promise = shardPromises.get(path);
  if (!promise) {
    promise = fetchJson<Game[]>(path).catch((error: unknown) => {
      shardPromises.delete(path);
      throw error;
    });
    shardPromises.set(path, promise);
  }
  return promise;
}

export async function drawRound(
  filters: Filters,
  recentKeys: ReadonlySet<string>,
  rng: () => number = Math.random,
): Promise<Round | null> {
  const shards = matchingShards(await loadIndex(), filters);
  let round: Round | null = null;
  for (let attempt = 0; attempt < DRAW_ATTEMPTS; attempt++) {
    const shard = pickWeighted(shards, rng());
    if (!shard) return null;
    const games = await loadShard(shard.path);
    round = roundAt(games, Math.floor(rng() * shard.rounds));
    if (round && !recentKeys.has(round.key)) return round;
  }
  return round;
}
