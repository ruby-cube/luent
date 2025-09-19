import { component } from "@rue/lumo";
import { ion, ionic, ionicTask } from "@rue/quarky";

export function TestIonicTask() {

   const $count = ion(0, {
      increment() {
         this.state++
      },
      decrement() {
         this.state--
      }
   })

   const $doubleCount = ion(() =>$count() * 2)

   ionicTask(() => {
      console.log('count:', $count())
   })

   ionicTask(() => {
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