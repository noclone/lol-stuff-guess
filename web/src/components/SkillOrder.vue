<script setup lang="ts">
import { computed } from "vue";
import { SKILL_KEYS, skillPriority } from "../game/skills";

const props = defineProps<{ skills: number[] }>();

const priority = computed(() => skillPriority(props.skills));
const levels = computed(() => props.skills.map((_, index) => index + 1));
</script>

<template>
  <div class="skill-order">
    <div
      v-if="priority.length > 0"
      class="priority"
    >
      <template
        v-for="(slot, index) in priority"
        :key="slot"
      >
        <span
          v-if="index > 0"
          class="arrow"
        >›</span>
        <span class="key">{{ SKILL_KEYS[slot - 1] }}</span>
      </template>
    </div>

    <div
      class="grid"
      :style="{ '--levels': levels.length }"
    >
      <span />
      <span
        v-for="level in levels"
        :key="`level-${level}`"
        class="level"
      >{{ level }}</span>
      <template
        v-for="(key, row) in SKILL_KEYS"
        :key="key"
      >
        <span class="row-key">{{ key }}</span>
        <span
          v-for="(slot, column) in skills"
          :key="`${key}-${column}`"
          class="cell"
          :class="{ filled: slot === row + 1, ultimate: slot === 4 && row === 3 }"
        >{{ slot === row + 1 ? key : "" }}</span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.skill-order {
  display: grid;
  justify-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
}

.priority {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.key {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1rem;
  font-weight: 700;
  color: #f0e6d2;
  background: #1e2328;
  border: 1px solid var(--gold);
  box-shadow: 0 0 0 1px #010a13;
}

.arrow {
  font-size: 1.2rem;
  color: var(--gold);
}

.grid {
  display: grid;
  grid-template-columns: 16px repeat(var(--levels), 17px);
  gap: 2px;
}

.level {
  font-size: 0.6rem;
  text-align: center;
  color: #a09b8c;
}

.row-key {
  display: grid;
  place-items: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--gold);
}

.cell {
  display: grid;
  place-items: center;
  height: 18px;
  font-size: 0.65rem;
  font-weight: 700;
  background: #010a13;
  border: 1px solid #1e2328;
}

.cell.filled {
  color: #f0e6d2;
  background: linear-gradient(180deg, #0f5a6e 0%, #0a3a4a 100%);
  border-color: #0ac8b9;
}

.cell.ultimate {
  background: linear-gradient(180deg, #785a28 0%, #4a3818 100%);
  border-color: var(--gold);
}
</style>
