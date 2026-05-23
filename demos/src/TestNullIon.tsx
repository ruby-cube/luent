import { component, If } from "@rue/luent";
import { ion, PRELUDE, watch } from "@rue/quarky";

export function TestNullIon() {
   const $frog = ion(null)

   watch($frog, () => {
      console.log('@@@frog', $frog())
   }, { phase: PRELUDE })

   return component(
      <div>

         <button on:click={e => $frog.value = 'kermit'}>click</button>
         <div>
            {If($frog,
               <div>{$frog}</div>
            )}
         </div>
      </div>
   )
}