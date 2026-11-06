<script setup lang="ts">
import type { Tier } from "@lsg/shared";
import { useI18n } from "vue-i18n";
import type { RoundProgress } from "../game/progress";
import { TIER_COLORS, tierIconUrl } from "../game/tiers";

defineProps<{
  tiers: Tier[];
  rounds: RoundProgress[];
  current: number;
}>();

const { t } = useI18n();
</script>

<template>
  <ol class="rail">
    <li
      v-for="(tier, index) in tiers"
      :key="tier"
      :class="[rounds[index]?.status, { current: index === current }]"
      :style="{ '--tier': TIER_COLORS[tier] }"
      :title="t(`tiers.${tier}`)"
    >
      <img
        :src="tierIconUrl(tier)"
        :alt="t(`tiers.${tier}`)"
      >
    </li>
  </ol>
</template>

<style scoped>
.rail {
  display: flex;
  justify-content: center;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

li {
  position: relative;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  background: #010a13;
  border: 1px solid #3c3c41;
  opacity: 0.45;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

li img {
  width: 22px;
  height: 22px;
}

li.won {
  opacity: 1;
  border-color: #0ac8b9;
  box-shadow: inset 0 0 0 1px rgb(10 200 185 / 35%);
}

li.lost {
  opacity: 0.8;
  border-color: #e84057;
  box-shadow: inset 0 0 0 1px rgb(232 64 87 / 35%);
}

li.lost img {
  filter: grayscale(1);
}

li.won::after,
li.lost::after {
  position: absolute;
  right: -5px;
  bottom: -5px;
  display: grid;
  place-items: center;
  width: 15px;
  height: 15px;
  font-size: 0.6rem;
  font-weight: 900;
  line-height: 1;
  color: #010a13;
  border: 1px solid #010a13;
  border-radius: 50%;
}

li.won::after {
  content: "✓";
  background: #0ac8b9;
}

li.lost::after {
  content: "✕";
  background: #e84057;
}

li.current {
  opacity: 1;
  transform: scale(1.15);
  border-color: var(--tier);
  box-shadow: 0 0 10px color-mix(in srgb, var(--tier) 55%, transparent);
}

@media (max-width: 480px) {
  .rail {
    gap: 0.25rem;
  }

  li {
    width: 28px;
    height: 28px;
  }

  li img {
    width: 18px;
    height: 18px;
  }
}
</style>
