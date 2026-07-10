import { component, template } from "@rue/luent";
import { ion, ionic, ionicTickTask } from "@rue/quarky";

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

   ionicTickTask(() => {
      console.log('count:', $count())
   })

   ionicTickTask(() => {
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