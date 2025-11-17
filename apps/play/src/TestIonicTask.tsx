import { component } from "@rue/lumo";
import { ion, ionic, queueIonicTask } from "@rue/quarky";

export function TestIonicTask() {

   const $count = Ion(0, {
      increment() {
         this.value++
      },
      decrement() {
         this.value--
      }
   })

   const $doubleCount = Ion(() => $count() * 2)

   queueIonicTask(() => {
      console.log('count:', $count())
   })

   queueIonicTask(() => {
      console.log('count x 2:', $doubleCount())
   })

   return component(
      <>
         hi
         <div>{$count}</div>
         <button on:click={e => $count.increment()}>increment</button>
         <button on:click={e => $count.decrement()}>decrement</button>
      </>

   )
}