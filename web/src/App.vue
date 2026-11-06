<script setup lang="ts">
import type { Daily } from "@lsg/shared";
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import DailySummary from "./components/DailySummary.vue";
import GameRound from "./components/GameRound.vue";
import RankRail from "./components/RankRail.vue";
import { loadDaily, localDate } from "./data/daily";
import { LOCALES, type Locale, loadStaticData, type StaticData } from "./data/ddragon";
import {
  applyGuess,
  type DailyProgress,
  firstUnfinished,
  giveUp,
  loadProgress,
  newProgress,
  type RoundProgress,
  saveProgress,
} from "./game/progress";
import { MODES, type Mode, maxAttempts } from "./game/rules";
import { setLocale } from "./i18n";
import { loadPreferredMode, savePreferredMode } from "./settings";

const { t, locale } = useI18n();

const data = ref<StaticData | null>(null);
const daily = ref<Daily | null>(null);
const progress = ref<DailyProgress | null>(null);
const viewIndex = ref(0);
const state = ref<"loading" | "ready" | "unavailable" | "error">("loading");

const currentRound = computed(() => daily.value?.rounds[viewIndex.value] ?? null);
const currentProgress = computed(() => progress.value?.rounds[viewIndex.value] ?? null);
const showSummary = computed(
  () => !!progress.value && !!daily.value && viewIndex.value >= daily.value.rounds.length,
);
const currentMaxAttempts = computed(() =>
  progress.value && currentRound.value
    ? maxAttempts(progress.value.mode, currentRound.value.player.items.length)
    : 0,
);

function resumeIndex(value: DailyProgress): number {
  const index = firstUnfinished(value);
  return index === -1 ? value.rounds.length : index;
}

function updateCurrentRound(update: (round: RoundProgress) => RoundProgress): void {
  const value = progress.value;
  const round = value?.rounds[viewIndex.value];
  if (!value || !round) return;
  const rounds = [...value.rounds];
  rounds[viewIndex.value] = update(round);
  progress.value = { ...value, rounds };
  saveProgress(progress.value);
}

const started = computed(
  () =>
    progress.value?.rounds.some((round) => round.status !== "playing" || round.misses.length > 0) ??
    false,
);

function chooseMode(mode: Mode): void {
  if (!progress.value || started.value) return;
  savePreferredMode(mode);
  progress.value = { ...progress.value, mode };
}

function guess(championKey: number): void {
  const answerKey = currentRound.value?.player.championId;
  if (answerKey === undefined) return;
  updateCurrentRound((round) =>
    applyGuess(round, championKey, answerKey, currentMaxAttempts.value),
  );
}

function next(): void {
  if (progress.value) viewIndex.value = resumeIndex(progress.value);
}

async function loadData(target: Locale): Promise<void> {
  try {
    data.value = await loadStaticData(target);
  } catch {
    state.value = "error";
  }
}

async function loadToday(): Promise<void> {
  try {
    const loaded = await loadDaily(localDate());
    if (!loaded) {
      state.value = "unavailable";
      return;
    }
    daily.value = loaded;
    progress.value = loadProgress(loaded) ?? newProgress(loaded, loadPreferredMode());
    viewIndex.value = progress.value ? resumeIndex(progress.value) : 0;
    state.value = "ready";
  } catch {
    state.value = "error";
  }
}

watch(locale, (value) => loadData(value as Locale));

onMounted(() => {
  void loadData(locale.value as Locale);
  void loadToday();
});
</script>

<template>
  <div class="app">
    <header>
      <h1>{{ t("title") }}</h1>
      <div class="controls">
        <div
          v-if="progress"
          class="toggle"
          :title="started ? t('modeLocked') : ''"
        >
          <button
            v-for="mode in MODES"
            :key="mode"
            :class="{ active: progress.mode === mode }"
            :disabled="started && progress.mode !== mode"
            @click="chooseMode(mode)"
          >
            {{ t(`mode.${mode}`) }}
          </button>
        </div>
        <div class="toggle">
          <button
            v-for="code in LOCALES"
            :key="code"
            :class="{ active: code === locale }"
            @click="setLocale(code)"
          >
            {{ code.toUpperCase() }}
          </button>
        </div>
      </div>
    </header>

    <main>
      <p
        v-if="state === 'error'"
        class="status"
      >
        {{ t("game.error") }}
      </p>
      <p
        v-else-if="state === 'unavailable'"
        class="status"
      >
        {{ t("daily.unavailable") }}
      </p>
      <p
        v-else-if="state === 'loading' || !data || !daily || !progress"
        class="status"
      >
        {{ t("game.loading") }}
      </p>
      <div
        v-else
        class="daily"
      >
        <RankRail
          :tiers="daily.rounds.map((round) => round.tier)"
          :rounds="progress.rounds"
          :current="showSummary ? -1 : viewIndex"
        />
        <DailySummary
          v-if="showSummary"
          :daily="daily"
          :progress="progress"
          :data="data"
        />
        <GameRound
          v-else-if="currentRound && currentProgress"
          :key="viewIndex"
          :round="currentRound"
          :progress="currentProgress"
          :max-attempts="currentMaxAttempts"
          :is-last="viewIndex === daily.rounds.length - 1"
          :mode="progress.mode"
          :data="data"
          :locale="locale as Locale"
          @guess="guess"
          @give-up="updateCurrentRound(giveUp)"
          @next="next"
        />
      </div>
    </main>

    <footer>
      LoL Stuff Guess isn't endorsed by Riot Games and doesn't reflect the views or opinions of
      Riot Games or anyone officially involved in producing or managing Riot Games properties.
      Riot Games, and all associated properties are trademarks or registered trademarks of Riot
      Games, Inc.
    </footer>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-width: 1440px;
  margin: 0 auto;
  padding: 1rem;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

h1 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--accent);
}

.controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toggle {
  display: flex;
  padding: 2px;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.toggle button {
  padding: 0.3rem 0.7rem;
  font-size: 0.85rem;
  color: var(--text-muted);
  background: none;
  border: none;
  border-radius: 6px;
}

.toggle button:hover:not(:disabled) {
  color: var(--text);
}

.toggle button:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.toggle button.active {
  color: var(--text);
  background: var(--surface-raised);
}

main {
  flex: 1;
  display: grid;
  justify-items: center;
  align-content: start;
  padding: max(2rem, calc(50vh - 280px)) 0 3rem;
}

.daily {
  display: grid;
  justify-items: center;
  gap: 1.5rem;
  width: 100%;
}

.status {
  color: var(--text-muted);
}

footer {
  font-size: 0.7rem;
  color: var(--text-muted);
  opacity: 0.7;
  text-align: center;
}
</style>
