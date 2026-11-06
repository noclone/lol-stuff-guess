<script setup lang="ts">
import type { Player } from "@lsg/shared";
import { useI18n } from "vue-i18n";
import type { StaticData } from "../data/ddragon";
import type { Hint } from "../game/rules";

defineProps<{
  hints: { hint: Hint; missesLeft: number }[];
  player: Player;
  durationSeconds: number;
  data: StaticData;
}>();

const { t } = useI18n();

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}
</script>

<template>
  <ul class="hints">
    <li
      v-for="{ hint, missesLeft } in hints"
      :key="hint"
      :class="{ locked: missesLeft > 0 }"
    >
      <span class="label">{{ t(`hints.${hint}`) }}</span>
      <span
        v-if="missesLeft > 0"
        class="value muted"
      >{{ t("hints.locked", missesLeft) }}</span>
      <span
        v-else-if="hint === 'spells'"
        class="value"
      >
        <img
          v-for="(spellId, index) in player.spells"
          :key="index"
          :src="data.spells.get(spellId)?.url"
          :alt="data.spells.get(spellId)?.name ?? ''"
          :title="data.spells.get(spellId)?.name ?? ''"
        >
      </span>
      <span
        v-else-if="hint === 'runes'"
        class="value"
      >
        <img
          v-for="runeId in [player.keystone, player.secondaryTree]"
          :key="runeId"
          :src="data.runes.get(runeId)?.url"
          :alt="data.runes.get(runeId)?.name ?? ''"
          :title="data.runes.get(runeId)?.name ?? ''"
        >
      </span>
      <span
        v-else-if="hint === 'role'"
        class="value"
      >{{ t(`positions.${player.position ?? "unknown"}`) }}</span>
      <span
        v-else
        class="value stats"
      >
        <span>{{ t("stats.kda") }} {{ player.kills }}/{{ player.deaths }}/{{ player.assists }}</span>
        <span>{{ t("stats.cs") }} {{ player.cs }}</span>
        <span>{{ t("stats.duration") }} {{ formatDuration(durationSeconds) }}</span>
        <span :class="player.win ? 'win' : 'loss'">{{ t(player.win ? "stats.win" : "stats.loss") }}</span>
      </span>
    </li>
  </ul>
</template>

<style scoped>
.hints {
  display: grid;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 3rem;
  padding: 0.5rem 0.9rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
}

li.locked {
  opacity: 0.6;
}

.label {
  font-weight: 600;
}

.value {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.value img {
  width: 36px;
  height: 36px;
  border-radius: 4px;
}

.stats {
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.9rem;
}

.muted {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.win {
  color: var(--success);
}

.loss {
  color: var(--danger);
}
</style>
