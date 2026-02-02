import { component } from "@rue/lumo";
import { Ion } from "@rue/quarky";

export function TestMutableDerivation() {
   const $first = Ion('Jon')
   const $last = Ion('Doe')
   const $fullname = Ion(() => $first() + ' ' + $last(), {
      '@set'(name: string) {
         [$first.value, $last.value] = name.split(' ')
      }
   })


   return component(
      <>
         <div>{$first} {$last}</div>
         <form on:submit={e => { e.preventDefault(); $fullname.value = e.target[0].value }}>
            <input value={$fullname}></input>
         </form>
      </>

   )
}