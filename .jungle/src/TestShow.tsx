import { component, template, Else, If } from "luent";
import { ion } from "@luent/quarky";

export function TestShow() {
   const $active = ion(false, {
      toggle() {
         $active.value = !$active.value
      }
   })

   return (

      <>
         <h1>Test Show</h1>
         <button on:click={$active.toggle}>toggle active</button>
         {If($active,'show',
            <p>Yay1!</p>
         )}
         {If($active, 'show',
            <p>Yay2!</p>
         )}
      </>
   )
}