import { ion, SYNC, watch } from "@luent/quarky";
import { component, template } from "luent";

export function TestSyncEffects() {

   const $count = ion(0, {
      increment() {
         console.log('start increment')
         this.value++;
         console.log('end increment')
      }
   })


   const $count2 = ion(0)

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





   return (

      <>
         <button on:click={e => { $count.increment() }}>increment</button>
      </>
   )
}