import { component } from "@rue/lumo";
import { ion, ionize, watch } from "@rue/quarky";
import { $renderphase, INTERNAL_RENDER, onInternalRender, onPostrender, onPrerender, onRender, onRenderCycleEnd, POSTRENDER, PRERENDER, RENDER } from "../../../packages/lumo/src/render-cycle";

export function TestEffectCyclePhases() {

   const $frog = ion('sir robin', {
      sing() {
         this.state += '!'
      }
   })

   const $frogB = ion('kermit', {
      sing() {
         this.state += '!'
      }
   })

   const $count = ion({
      frog: $frog
   }, {
      change() {
         this.state = {
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
   // }, { phase: INTERNAL_RENDER })

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