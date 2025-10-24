import { component } from "@rue/lumo";
import { ion, ionize, watch } from "@rue/quarky";
import {  PRERENDER } from "../../../packages/quarky/src/reactivity/render-cycle";

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
      console.log('### prerender: watch $count', count.frog)
      watch(()=>count.frog, ({ current: frog }) => {
         console.log('### frog', frog)
      })
   }, { eager: true, phase: PRERENDER })

   // watch($count, () => {
   //    console.log('### internal render: watch $count')
   // }, { phase: PRERENDER })

   // watch($count, () => {
   //    console.log('### render: watch $count')
   // }, { phase: RENDER })

   // watch($count, () => {
   //    console.log('### postrender: watch $count')
   // }, { phase: POSTRENDER })




   return component(
      <>

         <button on:click={e => $count.change()}>{$count}</button>
         <hr></hr>
         <button on:click={e => $frog.sing()}>{$frog}</button>
      </>
   )
}