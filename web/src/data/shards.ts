import type { RunePage } from "@lsg/shared";

const CDN = "https://ddragon.leagueoflegends.com";

export type ShardRow = keyof RunePage["shards"];

export const SHARD_ROWS: { row: ShardRow; options: number[] }[] = [
  { row: "offense", options: [5008, 5005, 5007] },
  { row: "flex", options: [5008, 5010, 5001] },
  { row: "defense", options: [5011, 5013, 5001] },
];

const SHARD_ICONS: Record<number, string> = {
  5001: "StatModsHealthScalingIcon",
  5005: "StatModsAttackSpeedIcon",
  5007: "StatModsCDRScalingIcon",
  5008: "StatModsAdaptiveForceIcon",
  5010: "StatModsMovementSpeedIcon",
  5011: "StatModsHealthPlusIcon",
  5013: "StatModsTenacityIcon",
};

export function shardIconUrl(shardId: number): string {
  return `${CDN}/cdn/img/perk-images/StatMods/${SHARD_ICONS[shardId] ?? "StatModsAdaptiveForceIcon"}.png`;
}
