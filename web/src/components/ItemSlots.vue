<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { itemIconUrl } from "../data/ddragon";

const SLOT_COUNT = 6;

const props = defineProps<{
  items: number[];
  revealedCount: number;
  version: string;
  itemNames: Map<number, string>;
}>();

const { t } = useI18n();

type Slot = { kind: "item"; id: number } | { kind: "hidden" } | { kind: "empty" };

const slots = computed<Slot[]>(() =>
  Array.from({ length: SLOT_COUNT }, (_, index): Slot => {
    const id = props.items[index];
    if (id === undefined) return { kind: "empty" };
    return index < props.revealedCount ? { kind: "item", id } : { kind: "hidden" };
  }),
);
</script>

<template>
  <div class="slots">
    <template
      v-for="(slot, index) in slots"
      :key="index"
    >
      <img
        v-if="slot.kind === 'item'"
        class="slot"
        :src="itemIconUrl(version, slot.id)"
        :alt="itemNames.get(slot.id) ?? ''"
        :title="itemNames.get(slot.id) ?? ''"
      >
      <div
        v-else-if="slot.kind === 'hidden'"
        class="slot hidden"
        :title="t('game.hiddenItem')"
      >
        ?
      </div>
      <div
        v-else
        class="slot empty"
        :title="t('game.emptySlot')"
      />
    </template>
  </div>
</template>

<style scoped>
.slots {
  display: grid;
  grid-template-columns: repeat(6, 64px);
  gap: 0.5rem;
  justify-content: center;
}

.slot {
  width: 64px;
  height: 64px;
  border-radius: 6px;
  border: 1px solid var(--border);
}

.hidden {
  display: grid;
  place-items: center;
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--accent);
  background: var(--surface-raised);
}

.empty {
  background: var(--surface);
  opacity: 0.5;
}

@media (max-width: 480px) {
  .slots {
    grid-template-columns: repeat(3, 64px);
  }
}
</style>
