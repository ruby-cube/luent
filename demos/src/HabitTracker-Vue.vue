<template>
  <div>
    {{ habit }}
    <ul
      class="habit-tracker"
      @mouseenter="hovering = true"
      @mouseleave="hovering = false"
    >
      <li
        v-for="n in goal"
        :key="n"
        class="unit"
        :class="{ filled: hovering ? n <= hoverCount : n <= count }"
        @mouseover="hoverCount = n"
        @click="count = n"
      ></li>
      <li v-if="achieved" class="achieved-star">🌟</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

const props = withDefaults(
  defineProps<{
    habit: string;
    goal: number;
  }>(),
  {
    habit: "Habit",
    goal: 5,
  }
);

const count = ref(0);
const hoverCount = ref(0);
const hovering = ref(false);

const achieved = computed(() => count.value === props.goal);
</script>

<style scoped>
ul.habit-tracker {
  display: inline-flex;
  gap: 0.25rem;
  margin: 0 0 0 0.5rem;
  padding: 0;
  list-style-type: none;
  vertical-align: middle;
}

li {
  width: 0.85rem;
  height: 0.85rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  background-color: transparent;
  box-sizing: border-box;
  text-align: center;
}

li.unit {
  border: 1px solid currentColor;
  border-radius: 50%;
  transition: background-color 0.15s ease;
}

li.filled {
  background-color: currentColor;
}

li.achieved-star {
  font-size: 0.95rem;
}
</style>
