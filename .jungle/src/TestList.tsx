import { component, template, For } from "luent";
import { ionize, observe } from "@luent/quarky";
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

   observe(list, () => {
      console.log('list changed')
   })


   return (

      <>
         hello world
         {For(list, m => m.id, (item) =>
            <p>{item.name}</p>
         )}
         <button on:click={e => list.insert()}>add</button>
      </>
   )
}