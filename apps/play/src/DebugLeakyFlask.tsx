import { component, Else, If, Polymorph } from "@rue/lumo";
import { ion } from "@rue/quarky";

// Bug conditions
// - conditional outside
// - conditional wrapped in div
// - all buttons after wrapper div gets flask discarded, but not buttons before or within

export function DebugLeakyFlask() {

   const $ready = ion(true)
   const $active = ion(true)

   return component(
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