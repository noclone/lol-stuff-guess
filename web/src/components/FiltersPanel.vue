<script setup lang="ts">
import { DURATION_BUCKETS, PLATFORM_LABELS, PLATFORMS, TIERS } from "@lsg/shared";
import { useI18n } from "vue-i18n";
import type { Filters } from "../data/pool";

const filters = defineModel<Filters>({ required: true });

const { t } = useI18n();

type Group = "platforms" | "tiers" | "durations";

const groups: { key: Group; title: string; options: readonly string[] }[] = [
  { key: "platforms", title: "filters.regions", options: PLATFORMS },
  { key: "tiers", title: "filters.tiers", options: TIERS },
  { key: "durations", title: "filters.durations", options: DURATION_BUCKETS },
];

function label(group: Group, option: string): string {
  if (group === "platforms") return PLATFORM_LABELS[option as keyof typeof PLATFORM_LABELS];
  return t(`${group}.${option}`);
}

function isSelected(group: Group, option: string): boolean {
  return (filters.value[group] as readonly string[]).includes(option);
}

function setGroup(group: Group, selected: readonly string[]): void {
  const allowed = groups.find((g) => g.key === group)?.options ?? [];
  filters.value = {
    ...filters.value,
    [group]: allowed.filter((option) => selected.includes(option)),
  };
}

function toggle(group: Group, option: string): void {
  const current = filters.value[group] as readonly string[];
  setGroup(
    group,
    current.includes(option) ? current.filter((o) => o !== option) : [...current, option],
  );
}
</script>

<template>
  <div class="filters">
    <fieldset
      v-for="group in groups"
      :key="group.key"
    >
      <legend>
        {{ t(group.title) }}
        <button
          type="button"
          class="link"
          @click="setGroup(group.key, group.options)"
        >
          {{ t("filters.all") }}
        </button>
        <button
          type="button"
          class="link"
          @click="setGroup(group.key, [])"
        >
          {{ t("filters.none") }}
        </button>
      </legend>
      <label
        v-for="option in group.options"
        :key="option"
        class="chip"
        :class="{ selected: isSelected(group.key, option) }"
      >
        <input
          type="checkbox"
          :checked="isSelected(group.key, option)"
          @change="toggle(group.key, option)"
        >
        {{ label(group.key, option) }}
      </label>
    </fieldset>
  </div>
</template>

<style scoped>
.filters {
  display: grid;
  gap: 0.75rem;
}

fieldset {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
}

legend {
  padding: 0 0.4rem;
  font-weight: 600;
}

.link {
  margin-left: 0.5rem;
  padding: 0;
  font-size: 0.85rem;
  color: var(--accent);
  background: none;
  border: none;
  cursor: pointer;
}

.chip {
  padding: 0.25rem 0.65rem;
  font-size: 0.9rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  cursor: pointer;
  user-select: none;
}

.chip.selected {
  color: var(--bg);
  background: var(--accent);
  border-color: var(--accent);
}

.chip input {
  display: none;
}
</style>
