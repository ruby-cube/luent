import { template } from "@rue/lumo";
import { Thru } from "../../../packages/lumo/src/iteratives/Thru";
import { Ion } from "@rue/quarky";

export function TestThru() {
   const æcount = Ion(1, {
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