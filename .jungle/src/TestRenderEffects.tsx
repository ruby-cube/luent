import { getFlask } from "@rue/flask";
import { component, atMount, template } from "@rue/luent";
import { ion, LAYOUT, PRELUDE, atPrelude, atRender, queueTask, RENDER, SYNC, TICK, watch } from "@rue/quarky";

export function TestRenderEffects() {
   const $count = ion(0)

   watch($count, () => {
      console.log('@@@SYNC $count changed', $count())
   }, { phase: SYNC })

   watch($count, () => {
      console.log('@@@PRELUDE $count changed', $count())
   }, { phase: PRELUDE })

   watch($count, () => {
      console.log('@@@RENDER $count changed', $count())
   }, { phase: RENDER })

   watch($count, () => {
      console.log('@@@LAYOUT $count changed', $count())
   }, { phase: LAYOUT })

   watch($count, () => {
      console.log('@@@TICK $count changed', $count())
   }, { phase: TICK })

   function increment() {
      atRender(() => {
         console.log('@@@ mutate count')
         $count.value++
      })
   }

   return component(
      <div on:click={increment}>hi</div>
   )
}