import { getActiveFlask, getFlask } from "@rue/flask";
import { component, Else, ElseIf, If } from "@rue/lumo";
import { ion } from "@rue/quarky";

export function TestIfElse() {
   const $active = ion(false)
   const $ready = ion(true)

   console.log('### outer flask', getActiveFlask())

   return component(
      <div>
         <button on:click={e => $active.state = !$active()}>toggle</button>
         <button on:click={e => $ready.state = !$ready()}>toggle</button>
         <show-hide>
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
         </show-hide>
      </div>
   )
}