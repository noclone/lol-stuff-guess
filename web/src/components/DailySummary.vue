<script setup lang="ts">
import type { Daily } from "@lsg/shared";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { msUntilNextDay } from "../data/daily";
import { championIconUrl, type StaticData } from "../data/ddragon";
import { attemptsUsed, type DailyProgress, shareText } from "../game/progress";
import { TIER_COLORS, tierIconUrl } from "../game/tiers";

const COPIED_FEEDBACK_MS = 2000;

const props = defineProps<{
  daily: Daily;
  progress: DailyProgress;
  data: StaticData;
}>();

const { t } = useI18n();

const now = ref(Date.now());
const copied = ref(false);
const manualCopy = ref<string | null>(null);
let timer: ReturnType<typeof setInterval> | undefined;

const found = computed(() => props.progress.rounds.filter((r) => r.status === "won").length);

const countdown = computed(() => {
  const totalSeconds = Math.floor(msUntilNextDay(new Date(now.value)) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":");
});

const rows = computed(() =>
  props.daily.rounds.map((round, index) => ({
    round,
    progress: props.progress.rounds[index],
    champion: props.data.championsByKey.get(round.player.championId),
  })),
);

onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now();
  }, 1000);
});

onBeforeUnmount(() => clearInterval(timer));

async function share(): Promise<void> {
  const url = `${location.origin}${location.pathname}`;
  const text = shareText(props.progress, t(`mode.${props.progress.mode}`), url);
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    manualCopy.value = text;
    return;
  }
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, COPIED_FEEDBACK_MS);
}
</script>

<template>
  <section class="summary lol-panel">
    <h2 class="lol-panel-title">
      {{ t("daily.summaryTitle") }}
    </h2>
    <p class="score">
      {{ t("daily.score", { found, total: progress.rounds.length }) }}
      <span class="mode">· {{ t(`mode.${progress.mode}`) }}</span>
    </p>
    <ol class="rows">
      <li
        v-for="{ round, progress: result, champion } in rows"
        :key="round.tier"
        :class="result?.status"
      >
        <span
          class="tier"
          :style="{ color: TIER_COLORS[round.tier] }"
        >
          <img
            :src="tierIconUrl(round.tier)"
            alt=""
          >
          {{ t(`tiers.${round.tier}`) }}
        </span>
        <span class="champion">
          <img
            v-if="champion"
            :src="championIconUrl(data.version, champion.id)"
            alt=""
          >
          {{ champion?.name ?? "?" }}
        </span>
        <span class="outcome">
          {{
            result?.status === "won" ? t("daily.attempts", attemptsUsed(result)) : t("daily.failed")
          }}
        </span>
      </li>
    </ol>
    <div class="footer">
      <button
        class="primary"
        @click="share"
      >
        {{ copied ? t("daily.copied") : t("daily.share") }}
      </button>
      <template v-if="manualCopy">
        <p class="manual-hint">
          {{ t("daily.copyManually") }}
        </p>
        <textarea
          class="manual"
          readonly
          rows="3"
          :value="manualCopy"
          @focus="($event.target as HTMLTextAreaElement).select()"
        />
      </template>
      <p class="next">
        {{ t("daily.next", { time: countdown }) }}
      </p>
    </div>
  </section>
</template>

<style scoped>
.summary {
  max-width: 540px;
}

.score {
  margin: 1rem 0 0.5rem;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1.4rem;
  font-weight: 700;
  text-align: center;
  color: #f0e6d2;
}

.score .mode {
  font-size: 0.9rem;
  color: #a09b8c;
}

.rows {
  display: grid;
  gap: 1px;
  margin: 0.5rem 1rem;
  padding: 0;
  list-style: none;
  background: rgb(120 90 40 / 45%);
}

li {
  display: grid;
  grid-template-columns: 9rem 1fr auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.4rem 0.75rem;
  background: #0a1324;
}

.tier,
.champion {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.tier img {
  height: 1em;
}

.champion {
  color: #f0e6d2;
}

.champion img {
  width: 28px;
  height: 28px;
}

.outcome {
  font-size: 0.85rem;
  font-weight: 700;
}

li.won .outcome {
  color: #0ac8b9;
}

li.lost .outcome {
  color: #e84057;
}

.footer {
  display: grid;
  justify-items: center;
  gap: 0.6rem;
  padding: 1rem;
}

.manual-hint {
  margin: 0;
  font-size: 0.85rem;
  color: #f0e6d2;
}

.manual {
  width: 100%;
  padding: 0.5rem;
  font: inherit;
  font-size: 0.85rem;
  color: #f0e6d2;
  background: #010a13;
  border: 1px solid var(--gold-dark);
  resize: none;
}

.next {
  margin: 0;
  font-size: 0.85rem;
  color: #a09b8c;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 480px) {
  li {
    grid-template-columns: 1fr auto;
  }

  .tier {
    grid-column: 1 / -1;
  }
}
</style>
