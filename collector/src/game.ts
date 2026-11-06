import {
  type Game,
  type Platform,
  type Player,
  POSITIONS,
  type Position,
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
  const [primary, secondary] = participant.perks.styles;

  return {
    championId: participant.championId,
    items: purchaseOrder(events, participant.participantId, finalItems, itemOrigins),
    spells: [participant.summoner1Id, participant.summoner2Id],
    keystone: primary?.selections[0]?.perk ?? 0,
    secondaryTree: secondary?.style ?? 0,
    position: toPosition(participant.teamPosition),
    kills: participant.kills,
    deaths: participant.deaths,
    assists: participant.assists,
    cs: participant.totalMinionsKilled + participant.neutralMinionsKilled,
    win: participant.win,
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
