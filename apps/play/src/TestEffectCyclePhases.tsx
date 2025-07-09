import { component } from "@rue/lumo";
import { ion, watch } from "@rue/quarky";
import { $renderphase, INTERNAL_RENDER, onInternalRender, onPostrender, onPrerender, onRender, onRenderCycleEnd, POSTRENDER, PRERENDER, RENDER } from "../../../packages/lumo/src/render-cycle";

export function TestEffectCyclePhases() {

   const $count = ion(0, {
      increment() {
         this.state++
      }
   })

   watch($count, async () => {
      console.log('### prerender: watch $count')
   }, { phase: PRERENDER })

   watch($count, () => {
      console.log('### internal render: watch $count')
   }, { phase: INTERNAL_RENDER })

   watch($count, () => {
      console.log('### render: watch $count')
   }, { phase: RENDER })

   watch($count, () => {
      console.log('### postrender: watch $count')
   }, { phase: POSTRENDER })




   return component(
      <button on:click={e => $count.increment()}>{$count}</button>
   )
}