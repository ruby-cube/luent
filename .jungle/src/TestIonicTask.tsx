import { component, template } from "@rue/luent";
import { ion, ionic, trackEffect } from "@rue/quarky";

export function TestIonicTask() {

   const $count = ion(0, {
      increment() {
         this.value++
      },
      decrement() {
         this.value--
      }
   })

   const $doubleCount = ion(() => $count() * 2)

   trackEffect(() => {
      console.log('count:', $count())
   })

   trackEffect(() => {
      console.log('count x 2:', $doubleCount())
   })

   return (

      <>
         hi
         <div>{$count}</div>
         <button on:click={e => $count.increment()}>increment</button>
         <button on:click={e => $count.decrement()}>decrement</button>
      </>

   )
}