import { component, template, For } from "@rue/luent";
import { ionize, watch } from "@rue/quarky";
let id = 4;

function genId() {
   return id++;
}
export function PlainList() {

   const list = ionize([
      { id: 0, name: 'apples' },
      { id: 1, name: 'peaches' },
      { id: 2, name: 'pear' },
      { id: 3, name: 'plums' },
   ]
   , {
      insert() {
         this.splice(2, 0, { id: genId(), name: 'tom thumb' })
      }
   }
)

   function insert(){
      list.splice(2, 0, { id: genId(), name: 'tom thumb' })
   }

   watch(list, () => {
      console.log('list changed')
   })


   return component(
      <>
         hello world
         {For(list, m => m.id, (item) =>
            <p>{item.name}</p>
         )}
         <button on:click={e => list.insert()}>add</button>
      </>
   )
}