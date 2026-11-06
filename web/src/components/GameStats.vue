<script setup lang="ts">
import type { Player, Tier } from "@lsg/shared";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { TIER_COLORS, tierIconUrl } from "../game/tiers";

const props = defineProps<{
  player: Player;
  tier: Tier;
  durationSeconds: number;
}>();

const { t } = useI18n();

const duration = computed(() => {
  const seconds = props.durationSeconds;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
});

const kdaRatio = computed(() => {
  const { kills, deaths, assists } = props.player;
  return deaths === 0 ? t("stats.perfect") : ((kills + assists) / deaths).toFixed(2);
});

const csPerMinute = computed(() => (props.player.cs / (props.durationSeconds / 60)).toFixed(1));
</script>

<template>
  <div class="lol-panel">
    <div
      class="result"
      :class="player.win ? 'win' : 'loss'"
    >
      {{ t(player.win ? "stats.win" : "stats.loss") }}
    </div>
    <dl class="cells">
      <div class="cell">
        <dt>{{ t("stats.rank") }}</dt>
        <dd
          class="tier"
          :style="{ color: TIER_COLORS[tier] }"
        >
          <img
            :src="tierIconUrl(tier)"
            alt=""
          >
          {{ t(`tiers.${tier}`) }}
        </dd>
      </div>
      <div class="cell">
        <dt>{{ t("stats.role") }}</dt>
        <dd>
          <img
            v-if="player.position"
            class="position"
            :src="`./positions/${player.position.toLowerCase()}.svg`"
            :alt="t(`positions.${player.position}`)"
            :title="t(`positions.${player.position}`)"
          >
          <template v-else>
            ?
          </template>
        </dd>
      </div>
      <div class="cell">
        <dt>{{ t("stats.kda") }}</dt>
        <dd>
          {{ player.kills }}<span class="slash">/</span><span class="deaths">{{ player.deaths }}</span><span class="slash">/</span>{{ player.assists }}
          <small>{{ kdaRatio }}</small>
        </dd>
      </div>
      <div class="cell">
        <dt>{{ t("stats.cs") }}</dt>
        <dd>
          {{ player.cs }}
          <small>{{ t("stats.perMinute", { n: csPerMinute }) }}</small>
        </dd>
      </div>
      <div class="cell">
        <dt>{{ t("stats.duration") }}</dt>
        <dd>{{ duration }}</dd>
      </div>
    </dl>
  </div>
</template>

<style scoped>
.result {
  padding: 0.35rem 0;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.35em;
  text-align: center;
  text-transform: uppercase;
  border-bottom: 1px solid var(--gold-dark);
}

.result.win {
  color: #0ac8b9;
  background: linear-gradient(90deg, transparent, rgb(10 200 185 / 12%), transparent);
}

.result.loss {
  color: #e84057;
  background: linear-gradient(90deg, transparent, rgb(232 64 87 / 12%), transparent);
}

.cells {
  display: flex;
  flex-wrap: wrap;
  gap: 1px;
  margin: 0;
  background: rgb(120 90 40 / 55%);
}

.cell {
  flex: 1 1 auto;
  display: grid;
  background: #0a1324;
  align-content: center;
  justify-items: center;
  gap: 0.2rem;
  padding: 0.55rem 0.5rem 0.65rem;
}


dt {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--gold);
}

dd {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #f0e6d2;
  font-variant-numeric: tabular-nums;
}

dd small {
  font-size: 0.75rem;
  font-weight: 500;
  color: #a09b8c;
}

.slash {
  margin: 0 0.1rem;
  color: #5b5a56;
}

.deaths {
  color: #e84057;
}

.tier {
  align-items: center;
}

.position {
  width: 1.6rem;
  height: 1.6rem;
}

.tier img {
  height: 1em;
}

</style>
