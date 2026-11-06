import { MODES, type Mode } from "./game/rules";

const MODE_STORAGE_KEY = "lsg.mode";

export function parseMode(raw: string | null): Mode {
  return MODES.find((mode) => mode === raw) ?? "classic";
}

export function loadPreferredMode(): Mode {
  return parseMode(localStorage.getItem(MODE_STORAGE_KEY));
}

export function savePreferredMode(mode: Mode): void {
  localStorage.setItem(MODE_STORAGE_KEY, mode);
}
