import { Component, template } from "@rue/luent";
import { watch, ion } from "@rue/quarky";

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




   return Component(
      <>

         <button on:click={e => $count.change()}>{$count}</button>
         <hr></hr>
         <button on:click={e => $frog.sing()}>{$frog}</button>
      </>
   )
}