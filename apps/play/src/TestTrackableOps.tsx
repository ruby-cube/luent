import { template, For } from "@rue/lumo";
import { ion, ionic, ionize } from "@rue/quarky";

export function TestTrackableOps() {
   const list = ionize([{ count: 0 }, { count: 11 }])
   const $filteredList = Ion(() =>list.filter(item => item.count > 10))
   const $length = Ion(()=>$filteredList().length)

console.log(list.filter(item => item.count > 10))
   return template(
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