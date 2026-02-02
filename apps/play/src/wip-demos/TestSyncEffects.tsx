import { ion, SYNC, watch } from "@rue/quarky";
import { PRELUDE } from "../../../../packages/quarky/src/reactivity/RenderCycle";
import { component } from "@rue/lumo";

export function TestSyncEffects() {

   const $count = Ion(0, {
      increment() {
         console.log('start increment')
         this.value++;
         console.log('end increment')
      }
   })


   const $count2 = Ion(0)

   watch($count, () => {
      console.log('$$$ ---effect')
      watch($count, () => {
         console.log('$$$ NESTED')
      }, { phase: SYNC })

   }, { phase: SYNC })

   watch($count, () => {
      console.log('$$$ --start effect increment')
      $count2.value = $count() + 1;
      console.log('--end effect increment')
   }, { phase: SYNC })

   // watch($count2, () => {
   //    console.log('$$$ --start effect2 increment')
   //    $count.value = $count2() + 1;
   //    console.log('--end effect2 increment')
   // }, { phase: SYNC })





   return component(
      <>
         <button on:click={e => { $count.increment() }}>increment</button>
      </>
   )
}