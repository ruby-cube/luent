import { component, template } from "luent";
import { ionize } from "@luent/quarky";

export function TestJSON() {
   const array = ionize([]as number[])

   return (

      <>
         <button on:click={e => array.push(array.length)}>add</button>
         <button on:click={e => array.pop()}>pop</button>
         <pre id="raw">{(JSON.stringify(array, undefined, 2))}</pre>
         <pre id="raw">{(JSON.stringify([...array], undefined, 2))}</pre>
         <pre id="raw">{(JSON.stringify(clone(array), undefined, 2))}</pre>
         <pre id="raw">{(JSON.stringify(cloneB(array), undefined, 2))}</pre>
      </>
   )
}

function clone(array) {
   const newArray = []
   for (const item of array) {
      newArray.push(item)
   }
   return newArray
}

function cloneB(array) {
   const newArray = []
   for (let i = 0; i < array.length; i++) {
      newArray.push(array[i])
   }
   return newArray
}