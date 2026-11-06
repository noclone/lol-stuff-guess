import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import {
  durationBucket,
  type Game,
  INDEX_FILE,
  POOL_FILE,
  type PoolIndex,
  type ShardRef,
  shardPath,
} from "@lsg/shared";
import { comparePatches } from "./game";

const POOL_FORMAT_VERSION = 1;

interface PoolFile {
  formatVersion: number;
  games: Game[];
}

export async function loadPreviousGames(source: string): Promise<Game[]> {
  const bytes = await readSource(source);
  if (!bytes) return [];
  const pool = JSON.parse(gunzipSync(bytes).toString("utf8")) as PoolFile;
  if (pool.formatVersion !== POOL_FORMAT_VERSION) {
    throw new Error(
      `${source} has pool format ${pool.formatVersion}, expected ${POOL_FORMAT_VERSION}`,
    );
  }
  return pool.games;
}

async function readSource(source: string): Promise<Buffer | null> {
  if (/^https?:\/\//.test(source)) {
    const response = await fetch(source);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Fetching ${source} failed with HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }
  try {
    return await readFile(source);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export function mergeGames(previous: Game[], fresh: Game[]): Game[] {
  const byId = new Map(previous.map((game) => [game.matchId, game]));
  for (const game of fresh) byId.set(game.matchId, game);
  return [...byId.values()];
}

export function keepRecentPatches(games: Game[], patchCount: number): Game[] {
  const kept = new Set(recentPatches(games, patchCount));
  return games.filter((game) => kept.has(game.patch));
}

function recentPatches(games: Game[], patchCount: number): string[] {
  return [...new Set(games.map((game) => game.patch))]
    .sort((a, b) => comparePatches(b, a))
    .slice(0, patchCount);
}

export function buildShards(
  games: Game[],
  now: Date,
): { index: PoolIndex; shards: Map<string, Game[]> } {
  const shards = new Map<string, Game[]>();
  const refs = new Map<string, ShardRef>();
  for (const game of games) {
    const duration = durationBucket(game.durationSeconds);
    const path = shardPath(game.platform, game.tier, duration);
    const shard = shards.get(path) ?? [];
    shard.push(game);
    shards.set(path, shard);
    const ref = refs.get(path) ?? {
      platform: game.platform,
      tier: game.tier,
      duration,
      rounds: 0,
      path,
    };
    ref.rounds += game.players.length;
    refs.set(path, ref);
  }
  return {
    index: {
      generatedAt: now.getTime(),
      patches: recentPatches(games, Number.POSITIVE_INFINITY),
      shards: [...refs.values()].sort((a, b) => a.path.localeCompare(b.path)),
    },
    shards,
  };
}

export async function writePool(outDir: string, games: Game[], now: Date): Promise<PoolIndex> {
  const { index, shards } = buildShards(games, now);
  await rm(join(outDir, "shards"), { recursive: true, force: true });
  for (const [path, shardGames] of shards) {
    const file = join(outDir, path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify(shardGames));
  }
  const pool: PoolFile = { formatVersion: POOL_FORMAT_VERSION, games };
  await writeFile(join(outDir, POOL_FILE), gzipSync(JSON.stringify(pool)));
  await writeFile(join(outDir, INDEX_FILE), JSON.stringify(index));
  return index;
}
