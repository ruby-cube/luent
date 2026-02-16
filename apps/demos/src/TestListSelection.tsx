import { component, createRoot, For, listen, NodeRef, Style, target } from "@rue/lumo";
import { moveUniqueItems, useRandomColorGenerator } from "@rue/utils";
import './style.css'
import { Ion, EACH, Ionic, as } from "@rue/quarky";

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

const IonicItem = (data: ItemData) => Ionic(new ListItem(data.id, data.content))

type IonicItem = ReturnType<typeof IonicItem>

// tests:
// - IonicArray.push()
// - IonicArray.unshift()
// - IonicArray.splice()
// - IonicArray.slice()
// - IonicModel extended methods
// - IonicModel init nested as Ionic
// - Set.add()
// - Set.has()
// - Set.delete()
// - Set.clear()

let newItemCount = 0;

export function TestListSelection() {

   const list = Ionic([
      { id: genId(), content: "frog" },
      { id: genId(), content: "robin" },
      { id: genId(), content: "fly" },
      { id: genId(), content: "swamp" },
   ], {
      [EACH]: as(IonicItem),

      insert(index: number) {
         const item = IonicItem({
            id: genId(),
            content: 'new item ' + ++newItemCount
         })
         if (index === this.length) {
            this.push(item)
            return item;
         }
         else if (index === 0) {
            this.unshift(item)
         }
         else {
            this.splice(index, 0, item)
            return item;
         }
      },

      remove(index: number) {
         this.splice(index, 1);
      }
   })

   const selected = Ionic(new Set<IonicItem>(), {
      toggle(item: IonicItem) {
         if (this.has(item)) {
            this.delete(item)
         }
         else {
            this.add(item)
         }
      }
   })

   const $listClone = Ion(() => list.slice())

   function insertItem(index: number) {
      list.insert(index)
   }

   function removeItem(index: number) {
      selected.delete(list[index] as IonicItem) // TODO: remove type-casting once Ionic is properly typed
      list.remove(index);
   }

   function moveSelectedItems(index: number) {
      moveUniqueItems(selected, list, index)
   }


   listen(window, 'click', e => {
      if ((e.target as HTMLElement).closest('.list')) {
         return;
      }

      selected.clear()
   })

   return component(
      <div style='transform: scale(.5); transform-origin: top'>
         <h1>hello world</h1>
         <div style='display: grid; grid-template-columns: 1fr 1fr; place-items: center; align-items: start'>
            <div style='width: 20vw'>
               <div class='list' style="list-style-type: none;">
                  <div on:click={e => insertItem(0)} style="background-color: gray; cursor: pointer">
                     +
                  </div>
                  <div on:click={e => moveSelectedItems(0)} style="background-color: white; cursor: pointer">
                     insert
                  </div>
                  {For(list, m => m.id, (item, $index) => (
                     <div>
                        <div
                           on:click={e => !target('style.cursor:pointer') && selected.toggle(item)}
                           style={{
                              'background-color': __TEST__ ? 'unset' : randomColor.get(),
                              outline: (selected.has(item) ? 'thick solid blue' : 'solid gray 1px'),
                           }}>
                           <p on:click={e => removeItem($index())} style="cursor: pointer">
                              X
                           </p>

                           <li on:click={e => item.changeContent()}>
                              {item.$content}
                           </li>
                           <p>{$index}</p>
                           <div on:click={e => { insertItem($index() + 1) }} style="background-color: gray; cursor: pointer">
                              +
                           </div>
                        </div>
                        <div
                           on:click={e => { moveSelectedItems($index() + 1) }}
                           style="background-color: white; cursor: pointer"
                        >
                           insert
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            <div style='width: 20vw; list-style-type: none;'>
               {For($listClone, ($item, index) =>
                  <div style={{ border: 'solid gray 1px', margin: '10px' }}>
                     <li>
                        {($item().content)}
                     </li>
                     <p>{index}</p>
                  </div>
               )}
            </div>
         </div>
      </div>
   )
      .css`
         body {
            overflow-y: scroll
         }
      `
}


const randomColor = useRandomColorGenerator()

let id = 0;
function genId() {
   return id++;
}




if (__TEST__) {
   createRoot(TestListSelection).mount('#root')
}