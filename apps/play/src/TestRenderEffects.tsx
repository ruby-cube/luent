import { atMounted, template } from "@rue/lumo";
import { Ion, PRELUDE, SYNC, watch } from "@rue/quarky";

export function TestRenderEffects() {
   const $count = Ion(0)

   watch($count, () => {
      console.log('$count changed', $count())
   }, { phase: PRELUDE })

   atMounted(() => {
      console.log('mutate count')
      $count.value++
   })

   return template(
      <div>hi</div>
   )
}