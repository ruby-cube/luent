//@ts-nocheck
import { template, FromTag } from "@rue/lumo";
import { ion } from "@rue/quarky";


//$count ---> render to DOM 


function Parent() {
   const $count = Ion(0)

   return template(
      <>
         <div>{$count}</div>
      </>
   )
}

function Child({ $count } : FromTag<{ count: number }>) {

   const $doubleCount = Ion(() =>)

      return template(
      <>
         <div>{$doubleCount}</div>
      </>
   )
}
