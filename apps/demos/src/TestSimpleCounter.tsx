import { component } from "@rue/lumo"
import { Ion } from "@rue/quarky"

export function TestSimpleCounter() {

   const $count = Ion(0, {
      increment() {
         this.value++
      },
      decrement() {
         this.value--
      }
   })

   const $doubleCount = Ion(() => $count() * 2)

   return component(
      <div>
         <div>{$count}</div>
         <div>{$doubleCount}</div>
         <hr></hr>
         <button on:click={e => $count.increment()}>+</button>
         <button on:click={e => $count.decrement()}>-</button>
      </div>
   )
}