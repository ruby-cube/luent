import { Component, template, For, listen, Style } from "@rue/luent";
import { moveUniqueItems, useRandomColorGenerator } from "@rue/utils";
import '../style.css'
import { instantUpdate,  ionic, EACH, ion} from "@rue/quarky";
import { $thisFlask, Flask, getActiveFlask } from "@rue/flask";

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

const ionicItem = (data: ItemData) => ionic(new ListItem(data.id, data.content))

type QItem = ReturnType<typeof ionicItem>


export function TestListDragDrop() {

   const list = ionic([
      { id: genId(), content: "frog" },
      { id: genId(), content: "robin" },
      { id: genId(), content: "fly" },
      { id: genId(), content: "swamp" },
   ], {
      [EACH]: { '-as': ionicItem }, // TODO: type

      insert(index: number) {
         const item = ionicItem({
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

   const selected = ionic(new Set<QItem>(), {
      toggle(item: QItem) {
         if (this.has(item)) {
            this.delete(item)
         }
         else {
            this.add(item)
         }
      }
   })

   function moveSelectedItems(index: number) {
      moveUniqueItems(selected, list, index)
   }

   function removeItem(index: number) {
      selected.delete(list[index] as QItem) // TODO: remove type-casting once Ionic is properly typed
      list.remove(index);
   }

   const $dragging = ion(false)
   const $x = ion(0)
   const $y = ion(0)

   function initDrag(e) {
      console.log('INIT DRAG')
      $dragging.value = true
      const bodyStyle = document.body.style
      bodyStyle.setProperty('user-select', 'none', 'important')
      const bodyCursor = bodyStyle.cursor
      bodyStyle.setProperty('cursor', 'grabbing', 'important')
      const style = e.target.style
      const styleTransform = style.transform
      style.setProperty('cursor', 'grabbing', 'important')
      style.setProperty('transition', 'none')
      const startX = e.clientX
      const startY = e.clientY
      const scene = getActiveFlask()! as Flask

      const prevX = $x()
      const prevY = $y()
      let deltaX = prevX
      let deltaY = prevY
      let frame: number = 0

      listen(window, 'mousemove', (e: MouseEvent) => {
         if (frame) cancelAnimationFrame(frame)
         deltaX = e.clientX - startX
         deltaY = e.clientY - startY
         frame = requestAnimationFrame(() => {
            instantUpdate(() => {
               console.log('moving', deltaX, deltaY)
               $x.value = prevX + deltaX
               $y.value = prevY + deltaY
            })
         })
      })

      listen(window, 'mouseup', e => {
         style.setProperty('transition', styleTransform)
         style.setProperty('cursor', 'grab')
         bodyStyle.setProperty('cursor', bodyCursor)
         bodyStyle.setProperty('user-select', 'auto')
         $dragging.value = false
         scene.emitDiscard()
      })
   }

   return Component(
      <>
         <h1>hello world</h1>
         <div style='user-select: none; display: grid; grid-template-columns: 1fr 1fr; width: 100vw'>
            <div style='width: 10vw'>
               <div on:click={e => list.insert(0)} style="background-color: gray; cursor: pointer">
                  +
               </div>

               {For(list, m => m.id, (item, $index) => (
                  // <div style={{ viewTransitionName: `item-${item.id}` }}>
                  <div>
                     <div
                        on:click={e => !e.from('style.cursor:pointer') && selected.toggle((console.log('$index', $index()), item))}
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
                     {/* {Style`
                        ::view-transition-group(item-${item.id}) {
                           transition-timing-function: cubic-bezier(0, 1, 1, 1);
                           animation-duration: 125ms;
                        }
                     `} */}
                  </div>
               ))}
               {/* <button style='view-transition-name: clear-btn' on:click={e => selected.clear()}>clear</button> */}
               <button on:click={e => selected.clear()}>clear</button>
            </div>

            {/* <div style='width: 30%'>
               {For($listClone, (item, $index) =>
               <div
               style={{
                  viewTransitionName: `itemclone-${item.id}`,
                  backgroundColor: randomColor.get()
                  }}>
                  
                  <li>
                  {item.$content}
                  </li>
                  <p>{$index}</p>
                  </div>
                  )}
                  </div> */}
            {/* {Style`
               ::view-transition-group(clear-btn) {
                  transition-timing-function: cubic-bezier(0, 1, 1, 1);
                  animation-duration: 125ms;
               }
            `} */}
         </div>
         <div class='drag-shield'></div>
         <div on:mousedown={initDrag} style={{ cursor: 'grab', transition: 'transform 250ms ease', backgroundColor: 'green', width: '100px', height: '100px', transform: (`translate(${$x()}px, ${$y()}px)`) }}></div>
         {Style`
               .drag-shield {
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: transparent; /* It can be transparent */
    cursor: grabbing; /* Optional: change cursor to indicate dragging */
}
               `}
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

   const ionizedValues = ionic(list.values())
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



