# Habit Tracker

<div id='habit-tracker-code'></div>

<script setup>
import { onMounted } from 'vue'

onMounted(async () => {
  if (typeof window === 'undefined') return;
  const { load } = await import('../../src/load-habit-tracker')
  load()
})
</script>