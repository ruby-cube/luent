import { ion, watch } from "@rue/quarky";
import { PRERENDER } from "../../../../packages/lumo/src/render-cycle";
import { component } from "@rue/lumo";

export function TestSyncEffects() {
  
      const $count = ion(0, {
         increment() {
            console.log('start increment')
            this.state++;
            console.log('end increment')
         }
      })

      
      const $count2 = ion(0)

      watch($count, () => {
         console.log('$$$ --start effect increment')
         $count2.state = $count() + 1;
         console.log('--end effect increment')
      }, { sync: true })

      watch($count2, () => {
         console.log('$$$ --start effect2 increment')
         $count.state = $count2() + 1;
         console.log('--end effect2 increment')
      }, { phase: PRERENDER })

      watch($count, () => {
         console.log('$$$ ---effect')
      }, { phase: PRERENDER })



   return component(
      <>
         <button on:click={e => { $count.increment() }}>increment</button>
      </>
   )
}