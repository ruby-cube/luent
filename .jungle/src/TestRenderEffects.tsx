import { getFlask } from "@luent/flask";
import { component, atAttach, template } from "luent";
import { ion, LAYOUT, PRELUDE, atPrelude, atRender, queueTask, RENDER, SYNC, TICK, observe } from "@luent/quarky";

export function TestRenderEffects() {
   const $count = ion(0)

   observe($count, () => {
      console.log('@@@SYNC $count changed', $count())
   }, { phase: SYNC })

   observe($count, () => {
      console.log('@@@PRELUDE $count changed', $count())
   }, { phase: PRELUDE })

   observe($count, () => {
      console.log('@@@RENDER $count changed', $count())
   }, { phase: RENDER })

   observe($count, () => {
      console.log('@@@LAYOUT $count changed', $count())
   }, { phase: LAYOUT })

   observe($count, () => {
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