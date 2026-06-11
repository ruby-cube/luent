//@ts-nocheck
import { component, template } from "@rue/luent";
import { ion } from "@rue/quarky";


//$count ---> render to DOM 


function Parent() {
   const $count = ion(0)

   return component(
      <>
         <div>{$count}</div>
      </>
   )
}

function Child({ $count } : { count: number }) {

   const $doubleCount = ion(() =>)

      return component(
      <>
         <div>{$doubleCount}</div>
      </>
   )
}
