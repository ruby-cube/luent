import { component, If } from "luent";
import { ion, PRELUDE, observe } from "@luently/quarky";

export function TestNullIon() {
   const $frog = ion(null)

   observe($frog, () => {
      console.log('@@@frog', $frog())
   }, { phase: PRELUDE })

   return (

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