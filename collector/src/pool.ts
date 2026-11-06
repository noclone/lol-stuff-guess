import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import { type Daily, dailyPath, type Game, POOL_FILE } from "@lsg/shared";
import { comparePatches } from "./game";

const POOL_FORMAT_VERSION = 4;

export interface Pool {
  games: Game[];
  dailies: Record<string, Daily>;
}

interface PoolFile extends Pool {
  formatVersion: number;
}

export async function loadPreviousPool(source: string): Promise<Pool> {
  const bytes = await readSource(source);
  if (!bytes) return { games: [], dailies: {} };
  const pool = JSON.parse(gunzipSync(bytes).toString("utf8")) as PoolFile;
  if (pool.formatVersion !== POOL_FORMAT_VERSION) {
    throw new Error(
      `${source} has pool format ${pool.formatVersion}, expected ${POOL_FORMAT_VERSION}`,
    );
  }
  return { games: pool.games, dailies: pool.dailies };
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
  const kept = new Set(
    [...new Set(games.map((game) => game.patch))]
      .sort((a, b) => comparePatches(b, a))
      .slice(0, patchCount),
  );
  return games.filter((game) => kept.has(game.patch));
}

export async function writePool(outDir: string, pool: Pool): Promise<void> {
  await rm(join(outDir, "daily"), { recursive: true, force: true });
  for (const daily of Object.values(pool.dailies)) {
    const file = join(outDir, dailyPath(daily.date));
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify(daily));
  }
  const file: PoolFile = { formatVersion: POOL_FORMAT_VERSION, ...pool };
  await writeFile(join(outDir, POOL_FILE), gzipSync(JSON.stringify(file)));
}
