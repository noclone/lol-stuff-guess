import { createI18n } from "vue-i18n";
import { LOCALES, type Locale } from "./data/ddragon";

const LOCALE_STORAGE_KEY = "lsg.locale";

const fr = {
  title: "LoL Stuff Guess",
  subtitle: "Un stuff tiré d'une vraie game classée. À quel champion appartient-il ?",
  mode: {
    classic: "Classique",
    challenger: "Challenger",
  },
  modeHelp: {
    classic: "Les 6 items sont visibles. Un indice par erreur à partir de la 3e.",
    challenger: "Les items arrivent un par un, dans l'ordre d'achat, puis les indices.",
  },
  filters: {
    title: "Filtres",
    regions: "Régions",
    tiers: "Rangs",
    durations: "Durée de game",
    all: "Tout",
    none: "Aucun",
  },
  tiers: {
    IRON: "Fer",
    BRONZE: "Bronze",
    SILVER: "Argent",
    GOLD: "Or",
    PLATINUM: "Platine",
    EMERALD: "Émeraude",
    DIAMOND: "Diamant",
    MASTER: "Maître",
    GRANDMASTER: "Grand Maître",
    CHALLENGER: "Challenger",
  },
  durations: {
    lt20: "< 20 min",
    "20-25": "20–25 min",
    "25-30": "25–30 min",
    "30-35": "30–35 min",
    gte35: "35 min et +",
  },
  positions: {
    TOP: "Top",
    JUNGLE: "Jungle",
    MIDDLE: "Mid",
    BOTTOM: "ADC",
    UTILITY: "Support",
    unknown: "Inconnu",
  },
  hints: {
    spells: "Sorts d'invocateur",
    runes: "Runes",
    role: "Rôle",
    stats: "Fin de game",
    locked: "Encore {n} erreur | Encore {n} erreurs",
  },
  stats: {
    kda: "KDA",
    cs: "CS",
    duration: "Durée",
    win: "Victoire",
    loss: "Défaite",
  },
  game: {
    placeholder: "Nom du champion…",
    giveUp: "Abandonner",
    next: "Champion suivant",
    won: "Trouvé en {n} essai ! | Trouvé en {n} essais !",
    lost: "C'était",
    misses: "Mauvaises réponses",
    patch: "Patch {patch}",
    hiddenItem: "Item pas encore révélé",
    emptySlot: "Emplacement vide",
    loading: "Chargement…",
    noRound: "Aucune game ne correspond à ces filtres.",
    error: "Impossible de charger les données. Réessaie plus tard.",
  },
};

type Messages = typeof fr;

const en: Messages = {
  title: "LoL Stuff Guess",
  subtitle: "A build taken from a real ranked game. Which champion does it belong to?",
  mode: {
    classic: "Classic",
    challenger: "Challenger",
  },
  modeHelp: {
    classic: "All 6 items are shown. One hint per miss from the 3rd one on.",
    challenger: "Items show up one by one, in purchase order, then the hints.",
  },
  filters: {
    title: "Filters",
    regions: "Regions",
    tiers: "Ranks",
    durations: "Game length",
    all: "All",
    none: "None",
  },
  tiers: {
    IRON: "Iron",
    BRONZE: "Bronze",
    SILVER: "Silver",
    GOLD: "Gold",
    PLATINUM: "Platinum",
    EMERALD: "Emerald",
    DIAMOND: "Diamond",
    MASTER: "Master",
    GRANDMASTER: "Grandmaster",
    CHALLENGER: "Challenger",
  },
  durations: {
    lt20: "< 20 min",
    "20-25": "20–25 min",
    "25-30": "25–30 min",
    "30-35": "30–35 min",
    gte35: "35+ min",
  },
  positions: {
    TOP: "Top",
    JUNGLE: "Jungle",
    MIDDLE: "Mid",
    BOTTOM: "ADC",
    UTILITY: "Support",
    unknown: "Unknown",
  },
  hints: {
    spells: "Summoner spells",
    runes: "Runes",
    role: "Role",
    stats: "End of game",
    locked: "{n} more miss | {n} more misses",
  },
  stats: {
    kda: "KDA",
    cs: "CS",
    duration: "Length",
    win: "Victory",
    loss: "Defeat",
  },
  game: {
    placeholder: "Champion name…",
    giveUp: "Give up",
    next: "Next champion",
    won: "Found in {n} guess! | Found in {n} guesses!",
    lost: "It was",
    misses: "Wrong guesses",
    patch: "Patch {patch}",
    hiddenItem: "Item not revealed yet",
    emptySlot: "Empty slot",
    loading: "Loading…",
    noRound: "No game matches these filters.",
    error: "Could not load the data. Try again later.",
  },
};

function initialLocale(): Locale {
  const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (saved && (LOCALES as readonly string[]).includes(saved)) return saved as Locale;
  return navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en";
}

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale(),
  fallbackLocale: "en",
  messages: { fr, en },
});

export function setLocale(locale: Locale): void {
  i18n.global.locale.value = locale;
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.documentElement.lang = locale;
}
