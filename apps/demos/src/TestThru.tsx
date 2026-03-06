import { template } from "@rue/lumo";
import { Thru } from "../../../packages/lumo/src/iteratives/Thru";
import { Ion } from "@rue/quarky";

export function TestThru() {
   const øcount = Ion(1, {
      increment() {
         this.value++
      },
      decrement() {
         this.value--
      }
   })

   return template(
      <div>
         <button on:click={e => øcount.increment()}>+</button>
         <button on:click={e => øcount.decrement()}>-</button>
         {Thru(øcount, (count) =>
            <div>{count}</div>
         )}
      </div>
   )
}