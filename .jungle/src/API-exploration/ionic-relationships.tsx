//@ts-nocheck
import { Component, template, FromTag } from "@rue/luent";
import { ion } from "@rue/quarky";


//$count ---> render to DOM 


function Parent() {
   const $count = ion(0)

   return Component(
      <>
         <div>{$count}</div>
      </>
   )
}

function Child({ $count } : FromTag<{ count: number }>) {

   const $doubleCount = ion(() =>)

      return Component(
      <>
         <div>{$doubleCount}</div>
      </>
   )
}
