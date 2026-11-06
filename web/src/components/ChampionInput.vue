<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { type Champion, championIconUrl } from "../data/ddragon";
import { flashError } from "../game/feedback";
import { searchChampions } from "../game/search";

const props = defineProps<{
  champions: Champion[];
  excludedKeys: ReadonlySet<number>;
  version: string;
  placeholder: string;
}>();

const emit = defineEmits<{ guess: [champion: Champion] }>();

const query = ref("");
const highlighted = ref(0);
const input = ref<HTMLInputElement | null>(null);

defineExpose({ flashError: () => flashError(input.value) });

const suggestions = computed(() => searchChampions(props.champions, query.value, props.excludedKeys));

watch(suggestions, () => {
  highlighted.value = 0;
});

onMounted(() => input.value?.focus());

function submit(champion: Champion | undefined): void {
  if (!champion) return;
  emit("guess", champion);
  query.value = "";
  input.value?.focus();
}

function move(step: number): void {
  const count = suggestions.value.length;
  if (count > 0) highlighted.value = (highlighted.value + step + count) % count;
}
</script>

<template>
  <div class="champion-input">
    <input
      ref="input"
      v-model="query"
      type="text"
      autocomplete="off"
      spellcheck="false"
      :placeholder="placeholder"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.enter.prevent="submit(suggestions[highlighted])"
      @keydown.esc="query = ''"
    >
    <ul
      v-if="suggestions.length > 0"
      class="suggestions"
    >
      <li
        v-for="(champion, index) in suggestions"
        :key="champion.key"
        :class="{ active: index === highlighted }"
        @mousedown.prevent="submit(champion)"
        @mouseenter="highlighted = index"
      >
        <img
          :src="championIconUrl(version, champion.id)"
          alt=""
        >
        {{ champion.name }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.champion-input {
  position: relative;
}

input {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1.05rem;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  outline: none;
}

input:focus {
  border-color: var(--accent);
}

.suggestions {
  position: absolute;
  z-index: 10;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 0.25rem;
  list-style: none;
  background: var(--surface-raised);
  border: 1px solid var(--border);
  border-radius: 8px;
}

li {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.35rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
}

li.active {
  background: var(--accent-soft);
}

li img {
  width: 32px;
  height: 32px;
  border-radius: 4px;
}
</style>
