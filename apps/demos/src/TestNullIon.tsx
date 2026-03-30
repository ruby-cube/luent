import { If, template } from "@rue/lumo";
import { Ion, PRELUDE, SYNC, watch } from "@rue/quarky";

export function TestNullIon() {
   const $frog = Ion(null)

   watch($frog, () => {
      console.log('@@@frog', $frog())
   }, { phase: PRELUDE })

   return template(
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