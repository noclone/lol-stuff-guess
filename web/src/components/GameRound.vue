<script setup lang="ts">
import { PLATFORM_LABELS } from "@lsg/shared";
import { computed, nextTick, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { type Champion, championIconUrl, type Locale, loadItemNames, type StaticData } from "../data/ddragon";
import type { Round } from "../data/pool";
import { HINTS, hintThreshold, itemThreshold, type Mode } from "../game/rules";
import ChampionInput from "./ChampionInput.vue";
import HintPanel from "./HintPanel.vue";
import ItemSlots from "./ItemSlots.vue";

const props = defineProps<{
  round: Round;
  mode: Mode;
  data: StaticData;
  locale: Locale;
}>();

const emit = defineEmits<{ next: [] }>();

const { t } = useI18n();

const misses = ref<Champion[]>([]);
const status = ref<"playing" | "won" | "lost">("playing");
const itemNames = ref(new Map<number, string>());
const nextButton = ref<HTMLButtonElement | null>(null);

const finished = computed(() => status.value !== "playing");
const player = computed(() => props.round.player);
const answer = computed(() => props.data.championsByKey.get(player.value.championId));
const missedKeys = computed(() => new Set(misses.value.map((c) => c.key)));

const revealedItems = computed(() => {
  if (finished.value) return player.value.items.length;
  return player.value.items.filter((_, i) => itemThreshold(props.mode, i) <= misses.value.length)
    .length;
});

const hints = computed(() =>
  HINTS.map((hint, index) => ({
    hint,
    missesLeft: finished.value
      ? 0
      : Math.max(0, hintThreshold(props.mode, player.value.items.length, index) - misses.value.length),
  })),
);

watch(
  () => [props.round.game.ddragonVersion, props.locale] as const,
  async ([version, locale]) => {
    itemNames.value = await loadItemNames(version, locale).catch(() => new Map());
  },
  { immediate: true },
);

watch(finished, async (isFinished) => {
  if (!isFinished) return;
  await nextTick();
  nextButton.value?.focus();
});

function guess(champion: Champion): void {
  if (finished.value) return;
  if (champion.key === player.value.championId) status.value = "won";
  else misses.value.push(champion);
}
</script>

<template>
  <section class="round">
    <p class="meta">
      {{ PLATFORM_LABELS[round.game.platform] }} · {{ t(`tiers.${round.game.tier}`) }} ·
      {{ t("game.patch", { patch: round.game.patch }) }}
    </p>

    <ItemSlots
      :items="player.items"
      :revealed-count="revealedItems"
      :version="round.game.ddragonVersion"
      :item-names="itemNames"
    />

    <div
      v-if="finished"
      class="result"
      :class="status"
    >
      <img
        v-if="answer"
        :src="championIconUrl(data.version, answer.id)"
        :alt="answer.name"
      >
      <div>
        <p v-if="status === 'won'">
          {{ t("game.won", misses.length + 1) }}
        </p>
        <p v-else>
          {{ t("game.lost") }}
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
        {{ t("game.next") }}
      </button>
    </div>
    <div
      v-else
      class="controls"
    >
      <ChampionInput
        :champions="data.champions"
        :excluded-keys="missedKeys"
        :version="data.version"
        :placeholder="t('game.placeholder')"
        @guess="guess"
      />
      <button
        class="secondary"
        @click="status = 'lost'"
      >
        {{ t("game.giveUp") }}
      </button>
    </div>

    <div
      v-if="misses.length > 0"
      class="misses"
    >
      <span>{{ t("game.misses") }} ({{ misses.length }})</span>
      <img
        v-for="champion in misses"
        :key="champion.key"
        :src="championIconUrl(data.version, champion.id)"
        :alt="champion.name"
        :title="champion.name"
      >
    </div>

    <HintPanel
      :hints="hints"
      :player="player"
      :duration-seconds="round.game.durationSeconds"
      :data="data"
    />
  </section>
</template>

<style scoped>
.round {
  display: grid;
  gap: 1.25rem;
}

.meta {
  margin: 0;
  text-align: center;
  color: var(--text-muted);
}

.controls {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
}

.result {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 1rem;
  border-radius: 8px;
  background: var(--surface-raised);
  border: 1px solid var(--border);
}

.result.won {
  border-color: var(--success);
}

.result.lost {
  border-color: var(--danger);
}

.result img {
  width: 64px;
  height: 64px;
  border-radius: 6px;
}

.result p {
  margin: 0;
}

.result .answer {
  font-size: 1.4rem;
  font-weight: 700;
}

.result button {
  margin-left: auto;
}

.misses {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  color: var(--text-muted);
}

.misses img {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  filter: grayscale(1);
  opacity: 0.7;
}
</style>
