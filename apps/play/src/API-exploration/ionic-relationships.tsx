//@ts-nocheck
import { component, FromTag } from "@rue/lumo";
import { ion } from "@rue/quarky";


//$count ---> render to DOM 


function Parent() {
   const $count = Ion(0)

   return component(
      <>
         <div>{$count}</div>
      </>
   )
}

function Child({ $count } : FromTag<{ count: number }>) {

   const $doubleCount = Ion(() =>)

      return component(
      <>
         <div>{$doubleCount}</div>
      </>
   )
}
