import {
  type Game,
  type Platform,
  type Player,
  POSITIONS,
  type Position,
  type RunePage,
  type Tier,
} from "@lsg/shared";
import type { ItemOrigins } from "./ddragon";
import {
  type MatchDto,
  type ParticipantDto,
  RANKED_SOLO_QUEUE_ID,
  type TimelineDto,
  type TimelineEventDto,
} from "./riot/api";

const MIN_GAME_DURATION_S = 300;

export function patchOf(gameVersion: string): string | null {
  const match = /^(\d+)\.(\d+)\./.exec(gameVersion);
  return match ? `${match[1]}.${match[2]}` : null;
}

export function comparePatches(a: string, b: string): number {
  const [aMajor = 0, aMinor = 0] = a.split(".").map(Number);
  const [bMajor = 0, bMinor = 0] = b.split(".").map(Number);
  return aMajor - bMajor || aMinor - bMinor;
}

export function ddragonVersionFor(patch: string, ddragonVersions: string[]): string | null {
  return ddragonVersions.find((v) => v.startsWith(`${patch}.`)) ?? null;
}

export function isPlayable(match: MatchDto): boolean {
  const { info } = match;
  return (
    info.queueId === RANKED_SOLO_QUEUE_ID &&
    info.gameDuration >= MIN_GAME_DURATION_S &&
    info.participants.length === 10 &&
    !info.participants.some((p) => p.gameEndedInEarlySurrender)
  );
}

export function matchDdragonVersion(match: MatchDto, ddragonVersions: string[]): string | null {
  const patch = patchOf(match.info.gameVersion);
  return patch ? ddragonVersionFor(patch, ddragonVersions) : null;
}

export function buildGame(
  match: MatchDto,
  timeline: TimelineDto,
  platform: Platform,
  tier: Tier,
  ddragonVersion: string,
  itemOrigins: ItemOrigins,
): Game | null {
  if (!isPlayable(match)) return null;
  const patch = patchOf(match.info.gameVersion);
  if (!patch) return null;

  const events = timeline.info.frames.flatMap((frame) => frame.events);
  const players = match.info.participants
    .map((participant) => buildPlayer(participant, events, itemOrigins))
    .filter((player) => player.items.length > 0);
  if (players.length === 0) return null;

  return {
    matchId: match.metadata.matchId,
    platform,
    tier,
    patch,
    ddragonVersion,
    durationSeconds: match.info.gameDuration,
    playedAt: match.info.gameCreation,
    players,
  };
}

function buildPlayer(
  participant: ParticipantDto,
  events: TimelineEventDto[],
  itemOrigins: ItemOrigins,
): Player {
  const finalItems = [
    participant.item0,
    participant.item1,
    participant.item2,
    participant.item3,
    participant.item4,
    participant.item5,
  ].filter((id) => id !== 0);

  return {
    championId: participant.championId,
    items: purchaseOrder(events, participant.participantId, finalItems, itemOrigins),
    spells: [participant.summoner1Id, participant.summoner2Id],
    runes: runePage(participant.perks),
    skills: skillOrder(events, participant.participantId),
    position: toPosition(participant.teamPosition),
    kills: participant.kills,
    deaths: participant.deaths,
    assists: participant.assists,
    cs: participant.totalMinionsKilled + participant.neutralMinionsKilled,
    win: participant.win,
  };
}

export function skillOrder(events: TimelineEventDto[], participantId: number): number[] {
  return events
    .filter(
      (e) =>
        e.type === "SKILL_LEVEL_UP" &&
        e.participantId === participantId &&
        e.levelUpType === "NORMAL" &&
        e.skillSlot !== undefined,
    )
    .map((e) => e.skillSlot as number);
}

function runePage(perks: ParticipantDto["perks"]): RunePage {
  const [primary, secondary] = perks.styles;
  return {
    primaryTree: primary?.style ?? 0,
    primary: primary?.selections.map((s) => s.perk) ?? [],
    secondaryTree: secondary?.style ?? 0,
    secondary: secondary?.selections.map((s) => s.perk) ?? [],
    shards: { ...perks.statPerks },
  };
}

function toPosition(value: string): Position | null {
  return (POSITIONS as readonly string[]).includes(value) ? (value as Position) : null;
}

export function purchaseOrder(
  events: TimelineEventDto[],
  participantId: number,
  finalItems: number[],
  itemOrigins: ItemOrigins,
): number[] {
  const purchases: { itemId: number; timestamp: number }[] = [];
  const destroyed = new Set<number>();
  for (const event of events) {
    if (event.participantId !== participantId) continue;
    if (event.type === "ITEM_PURCHASED" && event.itemId !== undefined) {
      purchases.push({ itemId: event.itemId, timestamp: event.timestamp });
    } else if (event.type === "ITEM_DESTROYED" && event.itemId !== undefined) {
      destroyed.add(event.itemId);
    } else if (event.type === "ITEM_UNDO" && event.beforeId) {
      const undone = purchases.findLastIndex((p) => p.itemId === event.beforeId);
      if (undone !== -1) purchases.splice(undone, 1);
    }
  }

  const takePurchase = (itemId: number): number | null => {
    const index = purchases.findLastIndex((p) => p.itemId === itemId);
    if (index === -1) return null;
    const [purchase] = purchases.splice(index, 1);
    return purchase?.timestamp ?? null;
  };

  const takeAncestorPurchase = (itemId: number): number | null => {
    const visited = new Set([itemId]);
    for (
      let origin = itemOrigins.get(itemId);
      origin !== undefined && !visited.has(origin);
      origin = itemOrigins.get(origin)
    ) {
      visited.add(origin);
      const timestamp = takePurchase(origin);
      if (timestamp !== null) return timestamp;
    }
    const grantedAtStart = [...visited].some((id) => id !== itemId && destroyed.has(id));
    return grantedAtStart ? 0 : null;
  };

  const entries = finalItems.map((itemId, slot) => ({
    itemId,
    slot,
    timestamp: takePurchase(itemId),
  }));
  for (const entry of entries) {
    entry.timestamp ??= takeAncestorPurchase(entry.itemId);
  }

  return entries
    .sort(
      (a, b) =>
        (a.timestamp ?? Number.POSITIVE_INFINITY) - (b.timestamp ?? Number.POSITIVE_INFINITY) ||
        a.slot - b.slot,
    )
    .map((entry) => entry.itemId);
}
