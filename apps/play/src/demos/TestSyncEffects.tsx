import { component } from "@rue/lumo";
import { ion, watch } from "@rue/quarky";


export function TestSyncEffects() {
   const $count = ion(0, {
      increment() {
         this.state++;
      },
      decrement() {
         this.state--;
      }
   })

   watch($count, () => {
      console.log('count', $count())
   })

   return component(
      <>
         <button on:click={e => { $count.increment() }}>increment</button>
      </>
   )
}