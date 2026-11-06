<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import FiltersPanel from "./components/FiltersPanel.vue";
import GameRound from "./components/GameRound.vue";
import { LOCALES, type Locale, loadStaticData, type StaticData } from "./data/ddragon";
import { drawRound, type Round } from "./data/pool";
import { MODES } from "./game/rules";
import { setLocale } from "./i18n";
import { loadSettings, saveSettings } from "./settings";

const RECENT_ROUNDS = 100;

const { t, locale } = useI18n();

const settings = ref(loadSettings());
const filtersOpen = ref(false);
const data = ref<StaticData | null>(null);
const round = ref<Round | null>(null);
const state = ref<"loading" | "ready" | "empty" | "error">("loading");
const recentKeys: string[] = [];
let drawId = 0;

async function nextRound(): Promise<void> {
  const id = ++drawId;
  state.value = "loading";
  try {
    const drawn = await drawRound(settings.value.filters, new Set(recentKeys));
    if (id !== drawId) return;
    round.value = drawn;
    if (drawn) {
      recentKeys.push(drawn.key);
      if (recentKeys.length > RECENT_ROUNDS) recentKeys.shift();
    }
    state.value = drawn ? "ready" : "empty";
  } catch {
    if (id === drawId) state.value = "error";
  }
}

async function loadData(target: Locale): Promise<void> {
  try {
    data.value = await loadStaticData(target);
  } catch {
    state.value = "error";
  }
}

watch(settings, saveSettings, { deep: true });
watch(() => settings.value.filters, nextRound, { deep: true });
watch(() => settings.value.mode, nextRound);
watch(locale, (value) => loadData(value as Locale));

onMounted(() => {
  void loadData(locale.value as Locale);
  void nextRound();
});
</script>

<template>
  <div class="app">
    <header>
      <div>
        <h1>{{ t("title") }}</h1>
        <p class="subtitle">
          {{ t("subtitle") }}
        </p>
      </div>
      <div class="locales">
        <button
          v-for="code in LOCALES"
          :key="code"
          class="link"
          :class="{ current: code === locale }"
          @click="setLocale(code)"
        >
          {{ code.toUpperCase() }}
        </button>
      </div>
    </header>

    <nav class="toolbar">
      <div class="modes">
        <button
          v-for="mode in MODES"
          :key="mode"
          :class="settings.mode === mode ? 'primary' : 'secondary'"
          @click="settings.mode = mode"
        >
          {{ t(`mode.${mode}`) }}
        </button>
      </div>
      <button
        class="secondary"
        :aria-expanded="filtersOpen"
        @click="filtersOpen = !filtersOpen"
      >
        {{ t("filters.title") }}
      </button>
    </nav>
    <p class="mode-help">
      {{ t(`modeHelp.${settings.mode}`) }}
    </p>

    <FiltersPanel
      v-if="filtersOpen"
      v-model="settings.filters"
    />

    <main>
      <p
        v-if="state === 'error'"
        class="status"
      >
        {{ t("game.error") }}
      </p>
      <p
        v-else-if="state === 'empty'"
        class="status"
      >
        {{ t("game.noRound") }}
      </p>
      <p
        v-else-if="state === 'loading' || !data || !round"
        class="status"
      >
        {{ t("game.loading") }}
      </p>
      <GameRound
        v-else
        :key="`${round.key}:${settings.mode}`"
        :round="round"
        :mode="settings.mode"
        :data="data"
        :locale="locale as Locale"
        @next="nextRound"
      />
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
  display: grid;
  gap: 1rem;
  max-width: 720px;
  margin: 0 auto;
  padding: 1.5rem 1rem 2rem;
}

header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

h1 {
  margin: 0;
  font-size: 1.8rem;
  color: var(--accent);
}

.subtitle {
  margin: 0.25rem 0 0;
  color: var(--text-muted);
}

.locales {
  display: flex;
  gap: 0.5rem;
}

.locales .link {
  padding: 0;
  font-weight: 600;
  color: var(--text-muted);
  background: none;
  border: none;
  cursor: pointer;
}

.locales .current {
  color: var(--accent);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

.modes {
  display: flex;
  gap: 0.5rem;
}

.mode-help {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-muted);
}

main {
  min-height: 420px;
}

.status {
  text-align: center;
  color: var(--text-muted);
}

footer {
  margin-top: 1rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}
</style>
