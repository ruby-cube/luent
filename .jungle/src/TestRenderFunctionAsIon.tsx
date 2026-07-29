import { component, template } from "luent";
import { ion } from "@luent/quarky";

export function TestRenderFunctionAsIon() {

   const $count = ion(0, {
      increment() {
         $count.value++
      }
   })

   function RenderCounter() {
      return (
         <div>{$count}</div>
      )
   }

   return (

      <div>
         <div>{RenderCounter}</div>
         <button on:click={e => $count.increment()}>+</button>
      </div>
   )
}


