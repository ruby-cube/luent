import { component, template, Else, If } from "luent";
import { ion } from "@luent/quarky"; 

// FIX: conditional is incorrectly mounted when
// + nested in another conditional
// + outer conditional has a fragment as the root
// + it is the initial mount

// - it has something to do with the timing of queueInternalRender
//   - when this.render() is placed outside of queueInternalRender, it mounts correctly (but subsequent mounting is broken)

// SOLUTION: If queueInternalRender is called within INTERNAL_RENDER phase, call fn immediately.

export function TestNestedConditionalB() {
   const $ready = ion(true)
   const $open = ion(true)

   return (

      <div>
         <button on:click={e=>$ready.value = !$ready()}>toggle ready</button>
         <button on:click={e=>$open.value = !$open()}>toggle open</button>
         {If($ready,
            <div>
               <div>(1) ready</div>
               {If($open,
                  <div>(2) open</div>
               )}
               {Else(
                  <div>(2) closed</div>
               )}
               <div>(3)</div>
            </div>
         )}
      </div>
   )
}
export function TestNestedConditional() {
   const $ready = ion(true)
   const $open = ion(true)

   return (

      <div>
         <button on:click={e=>$ready.value = !$ready()}>toggle ready</button>
         <button on:click={e=>$open.value = !$open()}>toggle open</button>
         {If($ready,
            <>
               <div>(1) ready</div>
               {If($open,
                  <div>(2) open</div>
               )}
               {Else(
                  <div>(2) closed</div>
               )}
               <div>(3)</div>
            </>
         )}
         <div>---</div>
      </div>
   )
}