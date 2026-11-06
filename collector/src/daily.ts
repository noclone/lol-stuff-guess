import { type Daily, type DailyRound, type Game, TIERS } from "@lsg/shared";

const MIN_ITEMS = 4;
const MIN_DURATION_S = 15 * 60;
const DAYS_BEFORE_TODAY = 1;
const DAYS_AFTER_TODAY = 2;
const DAY_MS = 24 * 3600 * 1000;

export type Rng = () => number;

export function utcDate(date: Date, offsetDays = 0): string {
  return new Date(date.getTime() + offsetDays * DAY_MS).toISOString().slice(0, 10);
}

export function pickDaily(
  date: string,
  games: readonly Game[],
  usedMatchIds: ReadonlySet<string>,
  rng: Rng,
): Daily {
  const usedChampions = new Set<number>();
  const usedToday = new Set<string>();
  const rounds = TIERS.map((tier): DailyRound => {
    const candidates = games
      .filter((game) => game.tier === tier && !usedMatchIds.has(game.matchId))
      .filter((game) => !usedToday.has(game.matchId))
      .flatMap((game) => game.players.map((player) => ({ game, player })))
      .filter(({ player }) => !usedChampions.has(player.championId));
    const preferred = candidates.filter(
      ({ game, player }) =>
        player.items.length >= MIN_ITEMS && game.durationSeconds >= MIN_DURATION_S,
    );
    const pool = preferred.length > 0 ? preferred : candidates;
    const picked = pool[Math.floor(rng() * pool.length)];
    if (!picked) throw new Error(`No unused ${tier} game left to build the daily of ${date}`);

    usedChampions.add(picked.player.championId);
    usedToday.add(picked.game.matchId);
    const { players: _players, playedAt: _playedAt, ...game } = picked.game;
    return { ...game, player: picked.player };
  });
  return { date, rounds };
}

export function ensureDailies(
  existing: Readonly<Record<string, Daily>>,
  games: readonly Game[],
  today: Date,
  keepDays: number,
  rng: Rng,
): Record<string, Daily> {
  const oldest = utcDate(today, -keepDays);
  const dailies: Record<string, Daily> = Object.fromEntries(
    Object.entries(existing).filter(([date]) => date >= oldest),
  );
  const usedMatchIds = new Set(
    Object.values(dailies).flatMap((daily) => daily.rounds.map((round) => round.matchId)),
  );
  for (let offset = -DAYS_BEFORE_TODAY; offset <= DAYS_AFTER_TODAY; offset++) {
    const date = utcDate(today, offset);
    if (dailies[date]) continue;
    const daily = pickDaily(date, games, usedMatchIds, rng);
    for (const round of daily.rounds) usedMatchIds.add(round.matchId);
    dailies[date] = daily;
  }
  return dailies;
}
