import { component, Else, ElseIf, If } from "@rue/lumo";
import { ion } from "@rue/quarky";

export function TestIfElse(){
   const $active = ion(true)
   const $ready = ion(true)
   return component(
      <>
      <button on:click={e=>$active.state = !$active()}>toggle</button>
      {If($active, 'show',
         <div>hey</div>
      )}
      {/* {ElseIf($ready, 'create',
         <div>ho</div>
      )} */}
      {Else('show',
         <div>hi</div>
      )}
      </>
   )
}