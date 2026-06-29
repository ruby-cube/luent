import { component, template } from "@rue/luent";
import { ion } from "@rue/quarky";

export function TestMutableDerivation() {
   const $first = ion('Jon')
   const $last = ion('Doe')
   const $fullname = ion(() => $first() + ' ' + $last(), {
      '@set'(name: string) {
         [$first.value, $last.value] = name.split(' ')
      }
   })


   return (

      <>
         <div>{$first} {$last}</div>
         <form on:submit={e => { e.preventDefault(); $fullname.value = e.target[0].value }}>
            <input value={$fullname}></input>
         </form>
      </>

   )
}