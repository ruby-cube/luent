import { component, template } from "@rue/luent";
import { Thru } from "../../../packages/luent/src/iteratives/Thru";
import { ion } from "@rue/quarky";

export function TestThru() {
   const $count = ion(1, {
      increment() {
         this.value++
      },
      decrement() {
         this.value--
      }
   })

   return (

      <div>
         <button on:click={e => $count.increment()}>+</button>
         <button on:click={e => $count.decrement()}>-</button>
         {Thru($count, (count) =>
            <div>{count}</div>
         )}
      </div>
   )
}