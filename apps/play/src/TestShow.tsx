import { component, Else, If } from "@rue/lumo";
import { ion } from "@rue/quarky";

export function TestShow() {
   const $active = ion(true, {
      toggle() {
         $active.state = !$active.state
      }
   })
   return component(
      <>
         <h1>Test Show</h1>
         <button on:click={$active.toggle}>toggle</button>
         {If($active, 'show', (console.log('rendering'),
            <p>Yay!</p>
         ))}
         {Else('show',
            <p>:(</p>
         )}
      </>
   )
}