import { component, listen, template } from "luent";
import { ion, observe } from "@luently/quarky";

export function TestOnceEager() {
   const $count = ion(0, {
      increment() { $count.value++ }
   })
   
   // observe($count, () => {
   //    console.log('$count is', $count())
   // }, { once: true, eager: true })

   listen(document, 'click', () => {
       console.log('$count is', $count())
   }, {once: true, eager: true})

   return (

      <div on:click={e => $count.increment()}>{$count}</div>
   )
}

