import { getActiveFlask, getFlask } from "@rue/flask";
import { template, Else, ElseIf, If } from "@rue/luent";
import { Ion } from "@rue/quarky";

export function TestIfElse() {
   const $active = Ion(false)
   const $ready = Ion(true)

   console.log('### outer flask', getActiveFlask())

   return template(
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