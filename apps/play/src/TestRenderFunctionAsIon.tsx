import { Component, template } from "@rue/luent";
import { ion } from "@rue/quarky";

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

   return Component(
      <div>
         <div>{RenderCounter}</div>
         <button on:click={e => $count.increment()}>+</button>
      </div>
   )
}


