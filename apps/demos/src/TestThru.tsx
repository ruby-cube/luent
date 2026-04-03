import { template } from "@rue/luent";
import { Thru } from "../../../packages/luent/src/iteratives/Thru";
import { ion } from "@rue/quarky";

export function TestThru() {
   const æcount = ion(1, {
      increment() {
         this.value++
      },
      decrement() {
         this.value--
      }
   })

   return template(
      <div>
         <button on:click={e => æcount.increment()}>+</button>
         <button on:click={e => æcount.decrement()}>-</button>
         {Thru(æcount, (count) =>
            <div>{count}</div>
         )}
      </div>
   )
}