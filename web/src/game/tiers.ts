import type { Tier } from "@lsg/shared";

export const TIER_COLORS: Record<Tier, string> = {
  IRON: "#a39597",
  BRONZE: "#c47d5f",
  SILVER: "#a9bec2",
  GOLD: "#e0a049",
  PLATINUM: "#3fbfe6",
  EMERALD: "#2dbd57",
  DIAMOND: "#9b6cf0",
  MASTER: "#b16ae6",
  GRANDMASTER: "#e05a5a",
  CHALLENGER: "#f4c874",
};

export function tierIconUrl(tier: Tier): string {
  return `./ranks/${tier.toLowerCase()}.svg`;
}
