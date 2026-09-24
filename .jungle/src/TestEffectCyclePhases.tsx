import { component, template } from "luent";
import { observe, ion } from "@luent/quarky";

export function TestEffectCyclePhases() {

   const $frog = ion('sir robin', {
      sing() {
         this.value += '!'
      }
   })

   const $frogB = ion('kermit', {
      sing() {
         this.value += '!'
      }
   })

   const $count = ion({
      frog: $frog
   }, {
      change() {
         this.value = {
            frog: $frogB
         }
      }
   })


   observe($count, async ({ current: count }) => {
      console.log('### prelude: observe $count', count.frog)
      observe(()=>count.frog, ({ current: frog }) => {
         console.log('### frog', frog)
      })
   }, { eager: true, phase: PRELUDE })

   // observe($count, () => {
   //    console.log('### internal render: observe $count')
   // }, { phase: PRELUDE })

   // observe($count, () => {
   //    console.log('### render: observe $count')
   // }, { phase: RENDER })

   // observe($count, () => {
   //    console.log('### postlude: observe $count')
   // }, { phase: POSTLUDE })




   return (

      <>

         <button on:click={e => $count.change()}>{$count}</button>
         <hr></hr>
         <button on:click={e => $frog.sing()}>{$frog}</button>
      </>
   )
}