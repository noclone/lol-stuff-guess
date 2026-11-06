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

export const POSITIONS = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"] as const;
export type Position = (typeof POSITIONS)[number];

export interface RunePage {
  primaryTree: number;
  primary: number[];
  secondaryTree: number;
  secondary: number[];
  shards: { offense: number; flex: number; defense: number };
}

export interface Player {
  championId: number;
  items: number[];
  spells: [number, number];
  runes: RunePage;
  skills: number[];
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

export type DailyRound = Omit<Game, "players" | "playedAt"> & { player: Player };

export interface Daily {
  date: string;
  rounds: DailyRound[];
}

export const POOL_FILE = "pool.json.gz";

export function dailyPath(date: string): string {
  return `daily/${date}.json`;
}
