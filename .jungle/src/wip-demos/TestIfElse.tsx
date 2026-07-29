import { getActiveFlask, getFlask } from "@luent/flask";
import { component, template, Else, ElseIf, If } from "luent";
import { Ion } from "@luent/quarky";

export function TestIfElse() {
   const $active = ion(false)
   const $ready = ion(true)

   console.log('### outer flask', getActiveFlask())

   return (

      <div>
         <button on:click={e => $active.value = !$active()}>toggle</button>
         <button on:click={e => $ready.value = !$ready()}>toggle</button>
         <show-view>
            {If($active,
               <div>
                  <hr></hr>
                  <div>hey</div>
               </div>
            )}
            {Else(
               <>
                  <div>hi</div>
                  {If($ready,
                     <div>
                        <p>hi ho1</p>
                        <p>hi ho2</p>
                        <p>hi ho3</p>
                     </div>
                  )}
               </>
            )}
         </show-view>
      </div>
   )
}