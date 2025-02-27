import { component, Else, If } from "@rue/lumo";
import { ion } from "@rue/quarky";

export function TestShow() {
   const $active = ion(false, {
      toggle() {
         $active.state = !$active.state
      }
   })

   return component(
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