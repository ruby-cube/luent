import { component } from "@rue/lumo";
import { Thru } from "../../../packages/lumo/src/iteratives/Thru";
import { Ion } from "@rue/quarky";

export function TestThru() {
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
         <button on:click={e => $count.increment()}>+</button>
         <button on:click={e => $count.decrement()}>-</button>
         {Thru($count, (count) =>
            <div>{count}</div>
         )}
      </div>
   )
}