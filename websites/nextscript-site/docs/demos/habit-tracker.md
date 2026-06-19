# Habit Tracker

<!-- <div v-once data-island="HabitTrackerDemo"></div> -->
:::luent
habit-tracker-demo
:::
<script setup>
import { onMounted } from 'vue'
import { hydrate } from '../../src/hydrate'

onMounted(async () => {
  if (typeof window === 'undefined') return;
  const { HabitTrackerDemo } = await import('../../src/demos/HabitTrackerDemo')
  // hydrate('HabitTrackerDemo', HabitTrackerDemo)
})
</script>


<div style='margin-bottom: 3rem'></div>

Featured in this demo:

- [`get` declaration](/guide/getter-syntax#get-declarations)
- [accessor variable read](/guide/getter-syntax#accessor-variable-reads)
- [accessor variable write](/guide/getter-syntax#accessor-variable-writes)
- [getter access](/guide/getter-syntax#for-getter-access)
- [derivation expression](/guide/getter-syntax#derivation-expressions)
- [JSX flow expression](/guide/jsx-syntax#jsx-flow-expressions)
- [JSX gateway function expression](/guide/jsx-syntax#jsx-gateway-function-expressions)
- [JSX component element](/guide/jsx-syntax#jsx-component-element)
