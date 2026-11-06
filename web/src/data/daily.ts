import { type Daily, dailyPath } from "@lsg/shared";

const DATA_BASE = "./data/";

export function localDate(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function msUntilNextDay(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
}

export async function loadDaily(date: string): Promise<Daily | null> {
  const response = await fetch(`${DATA_BASE}${dailyPath(date)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Daily ${date}: HTTP ${response.status}`);
  return (await response.json()) as Daily;
}
