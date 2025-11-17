import { component } from "@rue/lumo"
import { ion } from "@rue/quarky"

export function SimpleCounter() {

   const $count = Ion(0, {
      increment() {
         this.value++
      },
      decrement() {
         this.value--
      }
   })

   return component(
      <div>
         <div>{$count}</div>
         <hr></hr>
         <button on:click={e => $count.increment()}>increment</button>
         <button on:click={e => $count.decrement()}>decrement</button>
      </div>
   )
}