import { template } from "@rue/lumo";
import { ion, ionize, watch } from "@rue/quarky";
import {  PRELUDE } from "../../../packages/quarky/src/reactivity/RenderCycle";

export function TestEffectCyclePhases() {

   const $frog = Ion('sir robin', {
      sing() {
         this.value += '!'
      }
   })

   const $frogB = Ion('kermit', {
      sing() {
         this.value += '!'
      }
   })

   const $count = Ion({
      frog: $frog
   }, {
      change() {
         this.value = {
            frog: $frogB
         }
      }
   })


   watch($count, async ({ current: count }) => {
      console.log('### prelude: watch $count', count.frog)
      watch(()=>count.frog, ({ current: frog }) => {
         console.log('### frog', frog)
      })
   }, { eager: true, phase: PRELUDE })

   // watch($count, () => {
   //    console.log('### internal render: watch $count')
   // }, { phase: PRELUDE })

   // watch($count, () => {
   //    console.log('### render: watch $count')
   // }, { phase: RENDER })

   // watch($count, () => {
   //    console.log('### postlude: watch $count')
   // }, { phase: POSTLUDE })




   return template(
      <>

         <button on:click={e => $count.change()}>{$count}</button>
         <hr></hr>
         <button on:click={e => $frog.sing()}>{$frog}</button>
      </>
   )
}