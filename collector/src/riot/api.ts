import type { Platform, Tier } from "@lsg/shared";
import { z } from "zod";
import type { RiotClient } from "./client";

export const RANKED_SOLO_QUEUE_ID = 420;
const RANKED_SOLO_QUEUE = "RANKED_SOLO_5x5";

type RegionalRoute = "americas" | "asia" | "europe" | "sea";

const PLATFORM_ROUTES: Record<Platform, RegionalRoute> = {
  euw1: "europe",
  eun1: "europe",
  tr1: "europe",
  ru: "europe",
  me1: "europe",
  na1: "americas",
  br1: "americas",
  la1: "americas",
  la2: "americas",
  kr: "asia",
  jp1: "asia",
  oc1: "sea",
  sg2: "sea",
  tw2: "sea",
  vn2: "sea",
};

const APEX_ENDPOINTS: Partial<Record<Tier, string>> = {
  MASTER: "masterleagues",
  GRANDMASTER: "grandmasterleagues",
  CHALLENGER: "challengerleagues",
};

export const DIVISIONS = ["I", "II", "III", "IV"] as const;
export type Division = (typeof DIVISIONS)[number];

const leagueEntrySchema = z.object({ puuid: z.string() });
const leagueEntriesSchema = z.array(leagueEntrySchema);
const leagueListSchema = z.object({ entries: z.array(leagueEntrySchema) });
const matchIdsSchema = z.array(z.string());

const participantSchema = z.object({
  participantId: z.number(),
  championId: z.number(),
  item0: z.number(),
  item1: z.number(),
  item2: z.number(),
  item3: z.number(),
  item4: z.number(),
  item5: z.number(),
  summoner1Id: z.number(),
  summoner2Id: z.number(),
  perks: z.object({
    statPerks: z.object({ offense: z.number(), flex: z.number(), defense: z.number() }),
    styles: z.array(
      z.object({
        style: z.number(),
        selections: z.array(z.object({ perk: z.number() })),
      }),
    ),
  }),
  teamPosition: z.string(),
  kills: z.number(),
  deaths: z.number(),
  assists: z.number(),
  totalMinionsKilled: z.number(),
  neutralMinionsKilled: z.number(),
  win: z.boolean(),
  gameEndedInEarlySurrender: z.boolean(),
});
export type ParticipantDto = z.infer<typeof participantSchema>;

const matchSchema = z.object({
  metadata: z.object({ matchId: z.string() }),
  info: z.object({
    gameCreation: z.number(),
    gameDuration: z.number(),
    gameVersion: z.string(),
    queueId: z.number(),
    participants: z.array(participantSchema),
  }),
});
export type MatchDto = z.infer<typeof matchSchema>;

const timelineEventSchema = z.object({
  type: z.string(),
  timestamp: z.number(),
  participantId: z.number().optional(),
  itemId: z.number().optional(),
  beforeId: z.number().optional(),
  skillSlot: z.number().optional(),
  levelUpType: z.string().optional(),
});
export type TimelineEventDto = z.infer<typeof timelineEventSchema>;

const timelineSchema = z.object({
  info: z.object({
    frames: z.array(z.object({ events: z.array(timelineEventSchema) })),
  }),
});
export type TimelineDto = z.infer<typeof timelineSchema>;

export function isApexTier(tier: Tier): boolean {
  return tier in APEX_ENDPOINTS;
}

export class RiotApi {
  constructor(private readonly client: RiotClient) {}

  async apexPuuids(platform: Platform, tier: Tier): Promise<string[]> {
    const endpoint = APEX_ENDPOINTS[tier];
    if (!endpoint) throw new Error(`${tier} is not an apex tier`);
    const league = await this.client.get(
      platform,
      `/lol/league/v4/${endpoint}/by-queue/${RANKED_SOLO_QUEUE}`,
      leagueListSchema,
    );
    return league?.entries.map((e) => e.puuid) ?? [];
  }

  async leaguePagePuuids(
    platform: Platform,
    tier: Tier,
    division: Division,
    page: number,
  ): Promise<string[]> {
    const entries = await this.client.get(
      platform,
      `/lol/league/v4/entries/${RANKED_SOLO_QUEUE}/${tier}/${division}`,
      leagueEntriesSchema,
      { page },
    );
    return entries?.map((e) => e.puuid) ?? [];
  }

  async rankedMatchIds(platform: Platform, puuid: string, since: Date): Promise<string[]> {
    const ids = await this.client.get(
      PLATFORM_ROUTES[platform],
      `/lol/match/v5/matches/by-puuid/${puuid}/ids`,
      matchIdsSchema,
      { queue: RANKED_SOLO_QUEUE_ID, startTime: Math.floor(since.getTime() / 1000), count: 20 },
    );
    return ids ?? [];
  }

  match(platform: Platform, matchId: string): Promise<MatchDto | null> {
    return this.client.get(
      PLATFORM_ROUTES[platform],
      `/lol/match/v5/matches/${matchId}`,
      matchSchema,
    );
  }

  timeline(platform: Platform, matchId: string): Promise<TimelineDto | null> {
    return this.client.get(
      PLATFORM_ROUTES[platform],
      `/lol/match/v5/matches/${matchId}/timeline`,
      timelineSchema,
    );
  }
}
