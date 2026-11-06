<script setup lang="ts">
import type { DailyRound } from "@lsg/shared";
import { computed, nextTick, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  type Champion,
  championIconUrl,
  type Locale,
  loadItemNames,
  type StaticData,
} from "../data/ddragon";
import { shake } from "../game/feedback";
import { attemptsUsed, type RoundProgress } from "../game/progress";
import { type Hint, HINTS, hintThreshold, itemThreshold, type Mode } from "../game/rules";
import ChampionInput from "./ChampionInput.vue";
import GameStats from "./GameStats.vue";
import HintPanel from "./HintPanel.vue";
import ItemSlots from "./ItemSlots.vue";

const props = defineProps<{
  round: DailyRound;
  progress: RoundProgress;
  maxAttempts: number;
  isLast: boolean;
  mode: Mode;
  data: StaticData;
  locale: Locale;
}>();

const emit = defineEmits<{ guess: [championKey: number]; giveUp: []; next: [] }>();

const { t } = useI18n();

const itemNames = ref(new Map<number, string>());
const nextButton = ref<HTMLButtonElement | null>(null);
const roundElement = ref<HTMLElement | null>(null);
const championInput = ref<InstanceType<typeof ChampionInput> | null>(null);

const player = computed(() => props.round.player);
const finished = computed(() => props.progress.status !== "playing");
const missCount = computed(() => props.progress.misses.length);
const answer = computed(() => props.data.championsByKey.get(player.value.championId));
const missedKeys = computed(() => new Set(props.progress.misses));
const misses = computed(() =>
  props.progress.misses.flatMap((key) => props.data.championsByKey.get(key) ?? []),
);
const attemptsLeft = computed(() => props.maxAttempts - missCount.value);

const revealedItems = computed(() => {
  if (finished.value) return player.value.items.length;
  return player.value.items.filter((_, i) => itemThreshold(props.mode, i) <= missCount.value)
    .length;
});

const LEFT_HINTS: readonly Hint[] = ["spells", "skills"];

const unlockedHints = computed(() =>
  HINTS.filter(
    (_, index) =>
      finished.value ||
      hintThreshold(props.mode, player.value.items.length, index) <= missCount.value,
  ),
);

const leftHints = computed(() => unlockedHints.value.filter((hint) => LEFT_HINTS.includes(hint)));
const rightHints = computed(() =>
  unlockedHints.value.filter((hint) => !LEFT_HINTS.includes(hint)),
);

watch(
  () => [props.round.ddragonVersion, props.locale] as const,
  async ([version, locale]) => {
    itemNames.value = await loadItemNames(version, locale).catch(() => new Map());
  },
  { immediate: true },
);

watch(missCount, (count, previous) => {
  if (count <= previous) return;
  championInput.value?.flashError();
  shake(roundElement.value);
});

watch(finished, async (isFinished) => {
  if (!isFinished) return;
  await nextTick();
  nextButton.value?.focus();
});

function guess(champion: Champion): void {
  if (!finished.value) emit("guess", champion.key);
}
</script>

<template>
  <div class="layout">
    <HintPanel
      class="hint-column left"
      :hints="leftHints"
      :player="player"
      :data="data"
    />
    <section
      ref="roundElement"
      class="round"
    >
      <div class="intro">
        <p class="prompt">
          {{ t("game.prompt") }}
        </p>
        <p class="help">
          {{ t(`modeHelp.${mode}`) }}
        </p>
      </div>

      <ItemSlots
        :items="player.items"
        :revealed-count="revealedItems"
        :version="round.ddragonVersion"
        :item-names="itemNames"
      />

      <GameStats
        :player="player"
        :tier="round.tier"
        :duration-seconds="round.durationSeconds"
      />

      <div
        v-if="finished"
        class="result"
        :class="progress.status"
      >
        <img
          v-if="answer"
          :src="championIconUrl(data.version, answer.id)"
          :alt="answer.name"
        >
        <div>
          <p class="muted">
            {{ progress.status === "won" ? t("game.won", attemptsUsed(progress)) : t("game.lost") }}
          </p>
          <p class="answer">
            {{ answer?.name ?? "?" }}
          </p>
        </div>
        <button
          ref="nextButton"
          class="primary"
          @click="emit('next')"
        >
          {{ t(isLast ? "game.seeResult" : "game.nextRank") }}
        </button>
      </div>
      <div
        v-else
        class="play"
      >
        <ChampionInput
          ref="championInput"
          :champions="data.champions"
          :excluded-keys="missedKeys"
          :version="data.version"
          :placeholder="t('game.placeholder')"
          @guess="guess"
        />
        <div class="under-input">
          <div
            class="misses"
            :title="t('game.misses')"
          >
            <img
              v-for="champion in misses"
              :key="champion.key"
              :src="championIconUrl(data.version, champion.id)"
              :alt="champion.name"
              :title="champion.name"
            >
          </div>
          <div class="side">
            <span
              class="attempts"
              :class="{ last: attemptsLeft === 1 }"
            >{{ t("game.attemptsLeft", attemptsLeft) }}</span>
            <button
              class="link"
              @click="emit('giveUp')"
            >
              {{ t("game.giveUp") }}
            </button>
          </div>
        </div>
      </div>
    </section>
    <HintPanel
      class="hint-column right"
      :hints="rightHints"
      :player="player"
      :data="data"
    />
  </div>
</template>

<style scoped>
.intro {
  text-align: center;
}

.intro p {
  margin: 0;
}

.prompt {
  font-size: 1.15rem;
  font-weight: 600;
}

.intro .help {
  margin-top: 0.3rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 540px) minmax(0, 1fr);
  align-items: start;
  gap: 1.5rem;
  width: 100%;
}

.hint-column {
  width: 100%;
  max-width: 380px;
}

.hint-column.left {
  justify-self: end;
}

.hint-column.right {
  justify-self: start;
}

@media (max-width: 1180px) {
  .layout {
    grid-template-columns: minmax(0, 540px);
    justify-content: center;
  }

  .round {
    order: -1;
  }

  .hint-column {
    max-width: none;
  }
}

.round {
  display: grid;
  justify-items: center;
  gap: 1rem;
  width: 100%;
  max-width: 540px;
}

.play {
  width: 100%;
}

.under-input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 2rem;
  margin-top: 0.4rem;
}

.misses {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.misses img {
  width: 26px;
  height: 26px;
  border-radius: 4px;
  filter: grayscale(1);
  opacity: 0.6;
}

.side {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 1rem;
}

.attempts {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.attempts.last {
  color: var(--danger);
  font-weight: 600;
}

.link {
  padding: 0;
  font-size: 0.85rem;
  color: var(--text-muted);
  background: none;
  border: none;
}

.link:hover {
  color: var(--text);
}

.result {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 0.8rem 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.result.won {
  border-color: var(--success);
  animation:
    win-pop 0.5s cubic-bezier(0.2, 1.4, 0.4, 1),
    win-glow 1.4s ease-out;
}

.result.won img {
  animation: win-bounce 0.6s cubic-bezier(0.2, 1.6, 0.4, 1) 0.1s backwards;
}

@keyframes win-pop {
  from {
    transform: scale(0.94);
    opacity: 0;
  }
}

@keyframes win-glow {
  from {
    box-shadow: 0 0 0 4px rgb(63 182 123 / 45%), 0 0 28px rgb(63 182 123 / 45%);
  }

  to {
    box-shadow: 0 0 0 0 rgb(63 182 123 / 0%), 0 0 0 rgb(63 182 123 / 0%);
  }
}

@keyframes win-bounce {
  from {
    transform: scale(0.4) rotate(-8deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .result.won {
    animation: win-glow 1.4s ease-out;
  }

  .result.won img {
    animation: none;
  }
}

.result.lost {
  border-color: var(--danger);
}

.result img {
  width: 56px;
  height: 56px;
  border-radius: 6px;
}

.result p {
  margin: 0;
}

.muted {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.answer {
  font-size: 1.3rem;
  font-weight: 700;
}

.result button {
  margin-left: auto;
}
</style>
