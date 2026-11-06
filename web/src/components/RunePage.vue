<script setup lang="ts">
import type { RunePage } from "@lsg/shared";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { RuneTree } from "../data/ddragon";
import { SHARD_ROWS, shardIconUrl } from "../data/shards";

const TREE_COLORS: Record<number, string> = {
  8000: "#c8aa6e",
  8100: "#d44242",
  8200: "#9faafc",
  8300: "#49aab9",
  8400: "#a1d586",
};

const props = defineProps<{
  runes: RunePage;
  trees: Map<number, RuneTree>;
}>();

const { t } = useI18n();

const primary = computed(() => props.trees.get(props.runes.primaryTree));
const secondary = computed(() => props.trees.get(props.runes.secondaryTree));

function treeColor(treeId: number): string {
  return TREE_COLORS[treeId] ?? "#c8aa6e";
}
</script>

<template>
  <div class="rune-page">
    <section
      v-if="primary"
      class="tree"
      :style="{ '--tree': treeColor(primary.id) }"
    >
      <header>
        <img
          :src="primary.url"
          alt=""
        >
        {{ primary.name }}
      </header>
      <div
        v-for="(slot, index) in primary.slots"
        :key="index"
        class="row"
        :class="{ keystones: index === 0 }"
      >
        <img
          v-for="rune in slot"
          :key="rune.id"
          class="rune"
          :class="{ selected: runes.primary.includes(rune.id) }"
          :src="rune.url"
          :alt="rune.name"
          :title="rune.name"
        >
      </div>
    </section>

    <section
      v-if="secondary"
      class="tree"
      :style="{ '--tree': treeColor(secondary.id) }"
    >
      <header>
        <img
          :src="secondary.url"
          alt=""
        >
        {{ secondary.name }}
      </header>
      <div
        v-for="(slot, index) in secondary.slots.slice(1)"
        :key="index"
        class="row"
      >
        <img
          v-for="rune in slot"
          :key="rune.id"
          class="rune"
          :class="{ selected: runes.secondary.includes(rune.id) }"
          :src="rune.url"
          :alt="rune.name"
          :title="rune.name"
        >
      </div>

      <div class="shards">
        <div
          v-for="{ row, options } in SHARD_ROWS"
          :key="row"
          class="row"
        >
          <img
            v-for="shardId in options"
            :key="shardId"
            class="shard"
            :class="{ selected: runes.shards[row] === shardId }"
            :src="shardIconUrl(shardId)"
            :alt="t(`shards.${shardId}`)"
            :title="t(`shards.${shardId}`)"
          >
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.rune-page {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.tree {
  display: grid;
  align-content: start;
  gap: 0.55rem;
  padding: 0.75rem 0.5rem 0.9rem;
}

.tree + .tree {
  border-left: 1px solid rgb(120 90 40 / 55%);
}

header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin-bottom: 0.25rem;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tree);
}

header img {
  width: 22px;
  height: 22px;
}

.row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
}

.row + .row:not(.keystones) {
  padding-top: 0.15rem;
}

.rune {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  filter: grayscale(1);
  opacity: 0.3;
}

.keystones .rune {
  width: 38px;
  height: 38px;
}

.keystones .rune.selected {
  width: 50px;
  height: 50px;
}

.rune.selected {
  filter: none;
  opacity: 1;
  box-shadow:
    0 0 0 2px var(--tree),
    0 0 10px color-mix(in srgb, var(--tree) 60%, transparent);
  background: #0a1324;
}

.keystones .rune.selected {
  box-shadow: 0 0 12px color-mix(in srgb, var(--tree) 55%, transparent);
  background: none;
}

.shards {
  display: grid;
  gap: 0.35rem;
  margin-top: 0.4rem;
  padding-top: 0.6rem;
  border-top: 1px solid rgb(120 90 40 / 35%);
}

.shard {
  width: 24px;
  height: 24px;
  padding: 2px;
  border-radius: 50%;
  border: 1px solid #3c3c41;
  background: #010a13;
  filter: grayscale(1);
  opacity: 0.35;
}

.shard.selected {
  border-color: #c8aa6e;
  filter: none;
  opacity: 1;
}
</style>
