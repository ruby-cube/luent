import { component, template, For } from "luent";
import { ion, ionic, ionize } from "@luent/quarky";

export function TestTrackableOps() {
   const list = ionize([{ count: 0 }, { count: 11 }])
   const $filteredList = ion(() =>list.filter(item => item.count > 10))
   const $length = ion(()=>$filteredList().length)

console.log(list.filter(item => item.count > 10))
   return (

      <>
         <button on:click={e => list.push(ionize({ count: 12 }))}>click</button>
         {(list.length)}
         <div>{$length}</div>
         <div>{($filteredList().length)}</div>
         {For($filteredList, m=>m, (item)=>
            <div>{item.count}</div>
         )}
      </>
   )
}