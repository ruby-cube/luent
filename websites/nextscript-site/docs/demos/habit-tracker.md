# Habit Tracker

:::luent
HabitTrackerDemo
:::

<blockquote>
<small>
<b>Note:</b> The output tab displays modified transpiled code with descriptive variable names for comprehension. The actual implementation uses unique variable names to avoid name collisions.
</small>
</blockquote>

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



<script setup>
import { onMounted } from 'vue'

onMounted(async () => {
  if (typeof window === 'undefined') return;
  const { load } = await import('../../src/load-habit-tracker')
  load()
})
</script>