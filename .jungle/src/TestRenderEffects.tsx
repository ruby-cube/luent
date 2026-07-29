import { getFlask } from "@luent/flask";
import { component, atAttach, template } from "luent";
import { ion, LAYOUT, PRELUDE, atPrelude, atRender, queueTask, RENDER, SYNC, TICK, watch } from "@luent/quarky";

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

   return (

      <div on:click={increment}>hi</div>
   )
}