//@ts-nocheck
import { component, template } from "luent";
import { ion } from "@luent/quarky";


//$count ---> render to DOM 


function Parent() {
   const $count = ion(0)

   return (

      <>
         <div>{$count}</div>
      </>
   )
}

function Child({ $count } : { count: number }) {

   const $doubleCount = ion(() =>)

      return (

      <>
         <div>{$doubleCount}</div>
      </>
   )
}
