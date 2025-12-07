import { component, For, target } from "@rue/lumo";
import { moveUniqueItems, useRandomColorGenerator } from "@rue/utils";
import './style.css'
import { EACH, Ionic } from "../../../packages/quarky/src/ionic/Ionic";
import { Ion } from "@rue/quarky";


const randomColor = useRandomColorGenerator()
let id = 0;

function genId() {
   return id++;
}


class ListItem {
   id = genId()
   constructor(
      public content: string
   ) { }

   changeContent() {
      this.content = 'something else'
   }
}



export function List() {

   const list = Ionic([
      new ListItem("frog"),
      new ListItem("robin"),
      new ListItem("fly"),
      new ListItem("swamp")
   ], {
      [EACH]: { as: Ionic },

      insert(index: number) {
         const item = Ionic(new ListItem((Math.random() * 100).toString()))
         if (index === this.length) {
            this.push(item)
            return item;
         }
         else
            this.splice(index, 0, item)
         return item;
      },

      remove(index: number) {
         this.splice(index, 1);
      }
   })

   console.log('$$$ list values', list.values().next())
   console.log('$$$ list iterator', list[Symbol.iterator])

   // const $listClone = Ion(() => list.slice())

   const values = list.values()
   for (const value of values) {
      console.log('$$$ value', value)
   }

   for (const value of list) {
      console.log('$$$ value of list', value)
   }

   const ionizedValues = Ionic(list.values())
   for (const value of ionizedValues) {
      console.log('$$$ value of ionized values()', value)
   }

   const selected = Ionic(new Set<$$Item>(), {
      toggle(item) {
         if (this.has(item)) {
            this.delete(item)
         }
         else {
            this.add(item)
         }
      }
   })

   console.log('toggling selected', selected.size) // FIX: THis causes infinite loop

   try {
      console.log('has it?', selected.has(0))
   }
   catch (err) {
      console.error('EEP', err)
   }

   const vals = selected.values()
   Array.from(selected)

   function moveSelectedItems(index: number) {
      moveUniqueItems(selected, list, index)
   }

   function removeItem(index: number) {
      mu: selected.delete(list[index])
      mu: list.remove(index);
   }

   return component(
      <>
         <h1>hello world</h1>
         <div on:click={e => list.insert(0)} style="background-color: gray; cursor: pointer">
            insert!
         </div>

         {For(list, m => m.id, (item, $index) => (
            <div on:click={e => !target('style.cursor:pointer') && selected.toggle((console.log('$index', $index()), item))}
               style={{
                  backgroundColor: randomColor.get(),
                  outline: (selected.has(item) ? 'thick solid blue' : 'unset'),
               }}>
               <p on:click={e => removeItem($index())} style="cursor: pointer">
                  X
               </p>

               <li on:click={e => item.changeContent()}>
                  {item.$content}
               </li>
               <p>{$index}</p>
               <div on:click={e => { list.insert($index() + 1) }} style="background-color: gray; cursor: pointer">
                  insert
               </div>
               <div on:click={e => moveSelectedItems($index() + 1)} style="background-color: white; cursor: pointer">
                  insert
               </div>
            </div>
         ))}

         <button on:click={e => selected.clear()}>clear</button>
         <hr></hr>

         {/* {For($listClone, (item, $index) =>
            <div
               style={{
                  backgroundColor: randomColor.get(),
               }}>

               <li>
                  {item.$content}
               </li>
               <p>{$index}</p>
            </div>
         )} */}
         {/* <button
                on:click={[incrementCount, preventDefault.endHere, target(THIS_NODE)]}
            >
                clear
            </button> */}
         {/* <ListBlock>
                <ItemBlock content={$slot.$content()}></ItemBlock>
            </ListBlock> */}
      </>
      //             {/* <button on:click={If($active, capture.once(clearSelection))}>clear</button>


      //     <button
      //         on:click={[increment, { until: onMount }]}
      //     >
      //         clear
      //     </button>
      //     <button
      //         on:click={[
      //             If($active, [
      //                 increment, runOnce.preventDefault, target(THIS_NODE)
      //             ]),
      //             Else(decrement)
      //         ]}
      //     >
      //         clear
      //     </button> */}
      //         </div >
      //     ))}
      // </>
   )
}



