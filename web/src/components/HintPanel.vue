<script setup lang="ts">
import type { Player } from "@lsg/shared";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { StaticData } from "../data/ddragon";
import type { Hint } from "../game/rules";
import RunePage from "./RunePage.vue";
import SkillOrder from "./SkillOrder.vue";

const props = defineProps<{
  hints: Hint[];
  player: Player;
  data: StaticData;
}>();

const champion = computed(() => props.data.championsByKey.get(props.player.championId));

const { t } = useI18n();
</script>

<template>
  <TransitionGroup
    name="hint"
    tag="div"
    class="hints"
  >
    <section
      v-for="hint in hints"
      :key="hint"
      class="lol-panel"
    >
      <h3 class="lol-panel-title">
        {{ t(`hints.${hint}`) }}
      </h3>
      <div
        v-if="hint === 'spells'"
        class="spells"
      >
        <figure
          v-for="(spellId, index) in player.spells"
          :key="index"
        >
          <img
            :src="data.spells.get(spellId)?.url"
            :alt="data.spells.get(spellId)?.name ?? ''"
          >
          <figcaption>{{ data.spells.get(spellId)?.name ?? "?" }}</figcaption>
        </figure>
      </div>
      <RunePage
        v-else-if="hint === 'runes'"
        :runes="player.runes"
        :trees="data.runeTrees"
      />
      <SkillOrder
        v-else-if="hint === 'skills'"
        :skills="player.skills"
      />
      <div
        v-else
        class="class"
      >
        <div class="tags">
          <span
            v-for="tag in champion?.tags ?? []"
            :key="tag"
            class="tag"
          >{{ t(`classes.${tag}`) }}</span>
        </div>
        <p class="resource">
          {{ t("classes.resource") }}
          <strong>{{ champion?.resource || t("classes.noResource") }}</strong>
        </p>
      </div>
    </section>
  </TransitionGroup>
</template>

<style scoped>
.hints {
  display: grid;
  gap: 0.75rem;
}

.spells {
  display: flex;
  justify-content: center;
  gap: 2rem;
  padding: 0.75rem;
}

figure {
  display: grid;
  justify-items: center;
  gap: 0.35rem;
  margin: 0;
}

figure img {
  width: 44px;
  height: 44px;
  border: 1px solid var(--gold);
  box-shadow:
    0 0 0 1px #010a13,
    0 0 0 2px var(--gold-dark);
}

.class {
  display: grid;
  justify-items: center;
  gap: 0.6rem;
  padding: 0.85rem;
}

.tags {
  display: flex;
  gap: 0.6rem;
}

.tag {
  padding: 0.35rem 1rem;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #f0e6d2;
  background: #1e2328;
  border: 1px solid var(--gold);
  box-shadow: 0 0 0 1px #010a13;
}

.resource {
  margin: 0;
  font-size: 0.85rem;
  color: #a09b8c;
}

.resource strong {
  color: #f0e6d2;
}

figcaption {
  font-size: 0.8rem;
  font-weight: 600;
  color: #f0e6d2;
}

.hint-enter-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.hint-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
