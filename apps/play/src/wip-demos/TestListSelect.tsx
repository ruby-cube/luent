import { template, For, Style, target } from "@rue/luent";
import { moveUniqueItems, useRandomColorGenerator } from "@rue/utils";
import '../style.css'
import { asIonic, EACH, Ionic } from "../../../../packages/quarky/src/ionic/Ionic";
import { instantUpdate, Ion, queueTask } from "@rue/quarky";

class ListItem {
   constructor(
      public id: number,
      public content: string
   ) { }

   changeContent() {
      this.content = 'something else'
   }
}

type ItemData = { id: number, content: string }

const asIonicItem = (data: ItemData) => asIonic(new ListItem(data.id, data.content))

type QItem = ReturnType<typeof asIonicItem>


export function TestListSelect() {

   const list = asIonic([
      { id: genId(), content: "frog" },
      { id: genId(), content: "robin" },
      { id: genId(), content: "fly" },
      { id: genId(), content: "swamp" },
   ], {
      [EACH]: { '-as': asIonicItem }, // TODO: type

      insert(index: number) {
         const item = asIonicItem({
            id: genId(),
            content: (Math.random() * 100).toString()
         })
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

   const selected = asIonic(new Set<QItem>(), {
      toggle(item: QItem) {
         if (this.has(item)) {
            this.delete(item)
         }
         else {
            this.add(item)
         }
      }
   })

   const $listClone = Ion(() => list.slice())

   function moveSelectedItems(index: number) {
      moveUniqueItems(selected, list, index)
   }

   function removeItem(index: number) {
      selected.delete(list[index] as QItem) // TODO: remove type-casting once Ionic is properly typed
      list.remove(index);
   }

   iteratorTests(list, selected)
   let initial = true
   return template(
      <>
         <h1>hello world</h1>
         <div style='display: grid; grid-template-columns: 1fr 1fr; width: 100vw'>
            <div style='width: 10vw'>
               <div on:click={e => list.insert(0)} style="background-color: gray; cursor: pointer">
                  +
               </div>

               {For(list, m => m.id, (item, $index) => (
                  <div>
                     <div
                        on:click={e => !e.by('style.cursor:pointer') && selected.toggle((console.log('$index', $index()), item))}
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
                           +
                        </div>
                     </div>
                     <div on:click={e => moveSelectedItems($index() + 1)} style="background-color: white; cursor: pointer">
                        insert
                     </div>
                  </div>
               ))}
               <button on:click={e => selected.clear()}>clear</button>
            </div>

            {/* <div style='width: 30%'>
               {For($listClone, (item, $index) =>
                  <div
                     <li>
                        {item.$content}
                     </li>
                     <p>{$index}</p>
                  </div>
               )}
            </div> */}
         </div>
      </>
   )
}

function iteratorTests(list: any[], selected: Set<any>) {
   // Testing ionic iterator access
   console.log('$$$ list values', list.values().next())
   console.log('$$$ list iterator', list[Symbol.iterator])


   const values = list.values()
   for (const value of values) {
      console.log('$$$ value', value)
   }

   for (const value of list) {
      console.log('$$$ value of list', value)
   }

   const ionizedValues = asIonic(list.values())
   for (const value of ionizedValues) {
      console.log('$$$ value of ionized values()', value)
   }

   try {
      console.log('has it?', selected.has({}))
   }
   catch (err) {
      console.error('EEP', err)
   }

   const vals = selected.values()
   Array.from(selected)
}

const randomColor = useRandomColorGenerator()

let id = 0;
function genId() {
   return id++;
}

// weird experiments
/*
   <button on:click={If($active, capture.once(clearSelection))}>clear</button>
    <button
        on:click={[increment, { until: onMount }]}
    >
        clear
    </button>
    <button
        on:click={[
            If($active, [
                increment, runOnce.preventDefault, target(THIS_NODE)
            ]),
            Else(decrement)
        ]}
    >
        clear
    </button>
    ))}
            <button
                on:click={[incrementCount, preventDefault.endHere, target(THIS_NODE)]}
            >
                clear
            </button> 
         <ListBlock>
                <ItemBlock content={$slot.$content()}></ItemBlock>
            </ListBlock>
*/



