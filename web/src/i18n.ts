import { createI18n } from "vue-i18n";
import { LOCALES, type Locale } from "./data/ddragon";

const LOCALE_STORAGE_KEY = "lsg.locale";

const fr = {
  title: "LoL Stuff Guess",
  mode: {
    classic: "Classique",
    challenger: "Challenger",
  },
  modeLocked: "Mode verrouillé jusqu'au prochain daily : tu as déjà commencé celui-ci.",
  modeHelp: {
    classic: "Le stuff de fin de game d'un joueur en ranked. Chaque erreur débloque un indice.",
    challenger:
      "Les items arrivent un par un dans l'ordre d'achat : chaque erreur en révèle un de plus, puis des indices.",
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
  positions: {
    TOP: "Top",
    JUNGLE: "Jungle",
    MIDDLE: "Mid",
    BOTTOM: "ADC",
    UTILITY: "Support",
    unknown: "Inconnu",
  },
  shards: {
    title: "Fragments",
    "5001": "PV croissants",
    "5005": "Vitesse d'attaque",
    "5007": "Accélération de compétence",
    "5008": "Force adaptative",
    "5010": "Vitesse de déplacement",
    "5011": "PV",
    "5013": "Ténacité et résistance aux ralentissements",
  },
  hints: {
    spells: "Sorts d'invocateur",
    runes: "Runes",
    skills: "Ordre des sorts",
    class: "Classe",
  },
  classes: {
    Assassin: "Assassin",
    Fighter: "Combattant",
    Mage: "Mage",
    Marksman: "Tireur",
    Support: "Support",
    Tank: "Tank",
    resource: "Ressource :",
    noResource: "Aucune",
  },
  stats: {
    rank: "Rang",
    role: "Rôle",
    kda: "KDA",
    cs: "CS",
    duration: "Durée",
    perMinute: "{n}/min",
    perfect: "Parfait",
    win: "Victoire",
    loss: "Défaite",
  },
  daily: {
    unavailable: "Pas encore de daily pour aujourd'hui, reviens un peu plus tard !",
    summaryTitle: "Daily terminé",
    score: "{found}/{total} trouvés",
    attempts: "{n} essai | {n} essais",
    failed: "Raté",
    share: "Copier le résultat",
    copied: "Copié !",
    copyManually: "La copie automatique a échoué, copie le texte ci-dessous :",
    next: "Prochain daily dans {time}",
  },
  game: {
    prompt: "À quel champion appartient ce stuff ?",
    placeholder: "Nom du champion…",
    giveUp: "Abandonner",
    nextRank: "Rang suivant",
    seeResult: "Voir le résultat",
    attemptsLeft: "{n} essai restant | {n} essais restants",
    won: "Trouvé en {n} essai ! | Trouvé en {n} essais !",
    lost: "C'était",
    misses: "Mauvaises réponses",
    hiddenItem: "Item pas encore révélé",
    emptySlot: "Emplacement vide",
    loading: "Chargement…",
    error: "Impossible de charger les données. Réessaie plus tard.",
  },
};

type Messages = typeof fr;

const en: Messages = {
  title: "LoL Stuff Guess",
  mode: {
    classic: "Classic",
    challenger: "Challenger",
  },
  modeLocked: "Mode locked until the next daily: you already started this one.",
  modeHelp: {
    classic: "A ranked player's end-of-game build. Each miss unlocks a hint.",
    challenger:
      "Items show up one by one in purchase order: each miss reveals another one, then hints.",
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
  positions: {
    TOP: "Top",
    JUNGLE: "Jungle",
    MIDDLE: "Mid",
    BOTTOM: "ADC",
    UTILITY: "Support",
    unknown: "Unknown",
  },
  shards: {
    title: "Shards",
    "5001": "Health Scaling",
    "5005": "Attack Speed",
    "5007": "Ability Haste",
    "5008": "Adaptive Force",
    "5010": "Move Speed",
    "5011": "Health",
    "5013": "Tenacity and Slow Resist",
  },
  hints: {
    spells: "Summoner spells",
    runes: "Runes",
    skills: "Skill order",
    class: "Class",
  },
  classes: {
    Assassin: "Assassin",
    Fighter: "Fighter",
    Mage: "Mage",
    Marksman: "Marksman",
    Support: "Support",
    Tank: "Tank",
    resource: "Resource:",
    noResource: "None",
  },
  stats: {
    rank: "Rank",
    role: "Role",
    kda: "KDA",
    cs: "CS",
    duration: "Duration",
    perMinute: "{n}/min",
    perfect: "Perfect",
    win: "Victory",
    loss: "Defeat",
  },
  daily: {
    unavailable: "No daily for today yet, come back a bit later!",
    summaryTitle: "Daily complete",
    score: "{found}/{total} found",
    attempts: "{n} guess | {n} guesses",
    failed: "Missed",
    share: "Copy result",
    copied: "Copied!",
    copyManually: "Automatic copy failed, copy the text below:",
    next: "Next daily in {time}",
  },
  game: {
    prompt: "Which champion owned this build?",
    placeholder: "Champion name…",
    giveUp: "Give up",
    nextRank: "Next rank",
    seeResult: "See results",
    attemptsLeft: "{n} attempt left | {n} attempts left",
    won: "Found in {n} guess! | Found in {n} guesses!",
    lost: "It was",
    misses: "Wrong guesses",
    hiddenItem: "Item not revealed yet",
    emptySlot: "Empty slot",
    loading: "Loading…",
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
