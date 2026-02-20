import { template } from "@rue/lumo";
import { ionize, watch } from "@rue/quarky";

export function TestSetHas() {
   const mySet = ionize(new Set([0, 1, 2]))

   function deleteZero() {
      mySet.delete(0)
   }

   function addZero() {
      mySet.add(0)
   }

   watch((mySet.has(0)), ({ current, previous }) => {
      console.log('mySet changed', current, previous)
   })

   return template(
      <>
         <p style={{ outline: (mySet.has(0) ? 'thick solid blue' : 'thick solid red') }}>{(mySet.has(0))}</p>
         <button on:click={addZero}>add</button>
         <button on:click={deleteZero}>delete</button>
      </>
   )
}