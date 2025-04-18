import { component } from "@rue/lumo";
import { ionize, watch } from "@rue/quarky";
import { RENDER } from "../../../packages/lumo/src/render-cycle";

export function TestSetHas() {
   const mySet = ionize(new Set([0, 1, 2]))

   function deleteZero() {
      mySet.delete(0)
   }

   function addZero() {
      mySet.add(0)
   }

   watch((mySet.has(0)), ({ state, prevState }) => {
      console.log('mySet changed', state, prevState)
   }, {phase: RENDER})

   return component(
      <>
         <p style={{outline: (mySet.has(0) ? 'thick solid blue' : 'thick solid red')}}>{(mySet.has(0))}</p>
         <button on:click={addZero}>add</button>
         <button on:click={deleteZero}>delete</button>
      </>
   )
}