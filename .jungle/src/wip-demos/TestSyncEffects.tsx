import { ion, SYNC, observe } from "@luent/quarky";
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

   observe($count, () => {
      console.log('$$$ ---effect')
      observe($count, () => {
         console.log('$$$ NESTED')
      }, { phase: SYNC })

   }, { phase: SYNC })

   observe($count, () => {
      console.log('$$$ --start effect increment')
      $count2.value = $count() + 1;
      console.log('--end effect increment')
   }, { phase: SYNC })

   // observe($count2, () => {
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