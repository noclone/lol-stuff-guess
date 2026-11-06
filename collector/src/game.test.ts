import { describe, expect, it } from "vitest";
import {
  buildGame,
  comparePatches,
  ddragonVersionFor,
  matchDdragonVersion,
  patchOf,
  purchaseOrder,
} from "./game";
import type { MatchDto, ParticipantDto, TimelineDto, TimelineEventDto } from "./riot/api";

function participant(id: number, overrides: Partial<ParticipantDto> = {}): ParticipantDto {
  return {
    participantId: id,
    championId: 100 + id,
    item0: 3006,
    item1: 3031,
    item2: 0,
    item3: 0,
    item4: 0,
    item5: 0,
    summoner1Id: 4,
    summoner2Id: 14,
    perks: {
      styles: [
        { style: 8000, selections: [{ perk: 8008 }, { perk: 9111 }] },
        { style: 8100, selections: [{ perk: 8139 }] },
      ],
    },
    teamPosition: "BOTTOM",
    kills: 5,
    deaths: 2,
    assists: 7,
    totalMinionsKilled: 180,
    neutralMinionsKilled: 12,
    win: true,
    gameEndedInEarlySurrender: false,
    ...overrides,
  };
}

function match(overrides: Partial<MatchDto["info"]> = {}): MatchDto {
  return {
    metadata: { matchId: "EUW1_1" },
    info: {
      gameCreation: 1_700_000_000_000,
      gameDuration: 1_650,
      gameVersion: "16.22.731.4567",
      queueId: 420,
      participants: Array.from({ length: 10 }, (_, i) => participant(i + 1)),
      ...overrides,
    },
  };
}

const purchased = (participantId: number, itemId: number, timestamp: number): TimelineEventDto => ({
  type: "ITEM_PURCHASED",
  participantId,
  itemId,
  timestamp,
});

const timeline = (events: TimelineEventDto[]): TimelineDto => ({ info: { frames: [{ events }] } });
const VERSIONS = ["16.22.1", "16.21.1"];
const NO_ORIGINS = new Map<number, number>();

describe("patch helpers", () => {
  it("extracts the patch from a game version", () => {
    expect(patchOf("16.22.731.4567")).toBe("16.22");
    expect(patchOf("garbage")).toBeNull();
  });

  it("compares patches numerically", () => {
    expect(comparePatches("16.9", "16.10")).toBeLessThan(0);
    expect(comparePatches("17.1", "16.24")).toBeGreaterThan(0);
  });

  it("resolves the Data Dragon version of a patch", () => {
    expect(ddragonVersionFor("16.21", VERSIONS)).toBe("16.21.1");
    expect(ddragonVersionFor("16.2", VERSIONS)).toBeNull();
  });

  it("resolves the Data Dragon version of a match", () => {
    expect(matchDdragonVersion(match(), VERSIONS)).toBe("16.22.1");
    expect(matchDdragonVersion(match({ gameVersion: "16.23.1.1" }), VERSIONS)).toBeNull();
  });
});

describe("purchaseOrder", () => {
  it("orders final items by last purchase time", () => {
    const events = [
      purchased(1, 3031, 900_000),
      purchased(1, 3006, 300_000),
      purchased(2, 3031, 1),
    ];
    expect(purchaseOrder(events, 1, [3031, 3006], NO_ORIGINS)).toEqual([3006, 3031]);
  });

  it("ignores undone purchases", () => {
    const events = [
      purchased(1, 3031, 100),
      purchased(1, 3006, 200),
      { type: "ITEM_UNDO", participantId: 1, beforeId: 3006, timestamp: 250 },
      purchased(1, 3006, 900),
    ];
    expect(purchaseOrder(events, 1, [3006, 3031], NO_ORIGINS)).toEqual([3031, 3006]);
  });

  it("assigns distinct purchases to duplicated items", () => {
    const events = [purchased(1, 2055, 100), purchased(1, 3006, 200), purchased(1, 2055, 300)];
    expect(purchaseOrder(events, 1, [2055, 2055, 3006], NO_ORIGINS)).toEqual([2055, 3006, 2055]);
  });

  it("dates upgraded and transformed items with their purchased ancestor", () => {
    const origins = new Map([
      [3869, 3867],
      [3867, 3866],
      [3866, 3865],
      [3042, 3004],
      [3175, 3020],
    ]);
    const events = [
      purchased(1, 3865, 10),
      purchased(1, 1001, 200),
      purchased(1, 3020, 300),
      purchased(1, 3004, 400),
      purchased(1, 3089, 900),
    ];
    expect(purchaseOrder(events, 1, [3089, 3042, 3175, 3869], origins)).toEqual([
      3869, 3175, 3042, 3089,
    ]);
  });

  it("dates items upgraded from a free starting item at the start of the game", () => {
    const origins = new Map([
      [3869, 3867],
      [3867, 3866],
      [3866, 3865],
    ]);
    const events = [
      purchased(1, 2003, 12_000),
      purchased(1, 3075, 900_000),
      { type: "ITEM_DESTROYED", participantId: 1, itemId: 3865, timestamp: 556_000 },
      { type: "ITEM_DESTROYED", participantId: 2, itemId: 3089, timestamp: 600_000 },
    ];
    expect(purchaseOrder(events, 1, [3075, 2150, 3869], origins)).toEqual([3869, 3075, 2150]);
    expect(purchaseOrder(events.slice(0, 2), 1, [3075, 3869], origins)).toEqual([3075, 3869]);
  });

  it("lets direct purchases win over ancestor lookups", () => {
    const origins = new Map([[3042, 3004]]);
    const events = [purchased(1, 3004, 100), purchased(1, 3004, 500)];
    expect(purchaseOrder(events, 1, [3042, 3004], origins)).toEqual([3042, 3004]);
  });

  it("puts items without purchase event last, in slot order", () => {
    const events = [purchased(1, 3006, 100)];
    expect(purchaseOrder(events, 1, [3042, 3006, 3040], NO_ORIGINS)).toEqual([3006, 3042, 3040]);
  });
});

describe("buildGame", () => {
  it("builds a game with every player", () => {
    const game = buildGame(match(), timeline([]), "euw1", "GOLD", "16.22.1", NO_ORIGINS);
    expect(game).toMatchObject({
      matchId: "EUW1_1",
      platform: "euw1",
      tier: "GOLD",
      patch: "16.22",
      ddragonVersion: "16.22.1",
      durationSeconds: 1_650,
    });
    expect(game?.players).toHaveLength(10);
    expect(game?.players[0]).toEqual({
      championId: 101,
      items: [3006, 3031],
      spells: [4, 14],
      keystone: 8008,
      secondaryTree: 8100,
      position: "BOTTOM",
      kills: 5,
      deaths: 2,
      assists: 7,
      cs: 192,
      win: true,
    });
  });

  it("rejects remakes, other queues and short games", () => {
    const remake = match({
      participants: Array.from({ length: 10 }, (_, i) =>
        participant(i + 1, { gameEndedInEarlySurrender: true }),
      ),
    });
    expect(buildGame(remake, timeline([]), "euw1", "GOLD", "16.22.1", NO_ORIGINS)).toBeNull();
    expect(
      buildGame(match({ queueId: 440 }), timeline([]), "euw1", "GOLD", "16.22.1", NO_ORIGINS),
    ).toBeNull();
    expect(
      buildGame(match({ gameDuration: 200 }), timeline([]), "euw1", "GOLD", "16.22.1", NO_ORIGINS),
    ).toBeNull();
  });

  it("drops players without items and maps unknown positions to null", () => {
    const participants = Array.from({ length: 10 }, (_, i) => participant(i + 1));
    participants[0] = participant(1, { item0: 0, item1: 0 });
    participants[1] = participant(2, { teamPosition: "" });
    const game = buildGame(
      match({ participants }),
      timeline([]),
      "euw1",
      "GOLD",
      "16.22.1",
      NO_ORIGINS,
    );
    expect(game?.players).toHaveLength(9);
    expect(game?.players[0]?.position).toBeNull();
  });
});
