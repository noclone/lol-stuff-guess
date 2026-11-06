export const PLATFORMS = [
  "euw1",
  "eun1",
  "tr1",
  "ru",
  "me1",
  "na1",
  "br1",
  "la1",
  "la2",
  "kr",
  "jp1",
  "oc1",
  "sg2",
  "tw2",
  "vn2",
] as const;
export type Platform = (typeof PLATFORMS)[number];

export const PLATFORM_LABELS: Record<Platform, string> = {
  euw1: "EUW",
  eun1: "EUNE",
  tr1: "TR",
  ru: "RU",
  me1: "ME",
  na1: "NA",
  br1: "BR",
  la1: "LAN",
  la2: "LAS",
  kr: "KR",
  jp1: "JP",
  oc1: "OCE",
  sg2: "SEA",
  tw2: "TW",
  vn2: "VN",
};

export const TIERS = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
  "CHALLENGER",
] as const;
export type Tier = (typeof TIERS)[number];

export const DURATION_BUCKETS = ["lt20", "20-25", "25-30", "30-35", "gte35"] as const;
export type DurationBucket = (typeof DURATION_BUCKETS)[number];

export function durationBucket(seconds: number): DurationBucket {
  const minutes = seconds / 60;
  if (minutes < 20) return "lt20";
  if (minutes < 25) return "20-25";
  if (minutes < 30) return "25-30";
  if (minutes < 35) return "30-35";
  return "gte35";
}

export const POSITIONS = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"] as const;
export type Position = (typeof POSITIONS)[number];

export interface Player {
  championId: number;
  items: number[];
  spells: [number, number];
  keystone: number;
  secondaryTree: number;
  position: Position | null;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  win: boolean;
}

export interface Game {
  matchId: string;
  platform: Platform;
  tier: Tier;
  patch: string;
  ddragonVersion: string;
  durationSeconds: number;
  playedAt: number;
  players: Player[];
}

export interface ShardRef {
  platform: Platform;
  tier: Tier;
  duration: DurationBucket;
  rounds: number;
  path: string;
}

export interface PoolIndex {
  generatedAt: number;
  patches: string[];
  shards: ShardRef[];
}

export const INDEX_FILE = "index.json";
export const POOL_FILE = "pool.json.gz";

export function shardPath(platform: Platform, tier: Tier, duration: DurationBucket): string {
  return `shards/${platform}/${tier}/${duration}.json`;
}
