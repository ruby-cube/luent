# EmojiQuest: Powerset Panel

:::luent 
emoji-quest-demo
:::

<script setup>
import { onMounted } from 'vue'
import { hydrate } from '../../src/hydrate'

onMounted(async () => {
  if (typeof window === 'undefined') return;
  const { EmojiQuestDemo } = await import('../../src/demos/EmojiQuestDemo')
  // hydrate('EmojiQuestDemo', EmojiQuestDemo)
})
</script>



<div style='margin-bottom: 3rem'></div>

Featured in this demo:

- [`get` declaration](/guide/getter-syntax#get-declarations)
- [accessor variable read](/guide/getter-syntax#accessor-variable-reads)
- [accessor operator](/guide/getter-syntax.html#accessor-operator)
- [derivation expression](/guide/getter-syntax#derivation-expressions)
- [JSX component element](/guide/jsx-syntax#jsx-component-element)
