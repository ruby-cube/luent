import { component, template, Else, If } from "luent";
import { ion } from "@luent/quarky";

// Bug conditions
// - conditional outside
// - conditional wrapped in div
// - all buttons after wrapper div gets flask discarded, but not buttons before or within

export function DebugLeakyFlask() {

   const $ready = ion(true)
   const $active = ion(true)

   return (

      <>
         {If($ready,
            <>
               <button on:click={e => $active.value = !$active()}>change</button>
               <div>
                  {If($active, 'create',
                     <div>hi!</div>
                  )}
               </div>
               <button on:click={e => console.log('CLICK')}>
                  click me
               </button>
            </>
         )}

      </>
   )
}