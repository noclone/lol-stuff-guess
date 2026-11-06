import { DURATION_BUCKETS, PLATFORMS, TIERS } from "@lsg/shared";
import type { Filters } from "./data/pool";
import { MODES, type Mode } from "./game/rules";

const SETTINGS_STORAGE_KEY = "lsg.settings";

export interface Settings {
  mode: Mode;
  filters: Filters;
}

export function defaultSettings(): Settings {
  return {
    mode: "classic",
    filters: {
      platforms: [...PLATFORMS],
      tiers: [...TIERS],
      durations: [...DURATION_BUCKETS],
    },
  };
}

function subsetOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T[]): T[] {
  if (!Array.isArray(value)) return fallback;
  return allowed.filter((item) => value.includes(item));
}

export function parseSettings(raw: string | null): Settings {
  const defaults = defaultSettings();
  if (!raw) return defaults;
  try {
    const parsed = JSON.parse(raw) as Partial<{
      mode: unknown;
      filters: Partial<Record<keyof Filters, unknown>>;
    }>;
    return {
      mode: MODES.find((mode) => mode === parsed.mode) ?? defaults.mode,
      filters: {
        platforms: subsetOf(parsed.filters?.platforms, PLATFORMS, defaults.filters.platforms),
        tiers: subsetOf(parsed.filters?.tiers, TIERS, defaults.filters.tiers),
        durations: subsetOf(
          parsed.filters?.durations,
          DURATION_BUCKETS,
          defaults.filters.durations,
        ),
      },
    };
  } catch {
    return defaults;
  }
}

export function loadSettings(): Settings {
  return parseSettings(localStorage.getItem(SETTINGS_STORAGE_KEY));
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}
