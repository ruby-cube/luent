//@ts-nocheck
import { atMounted, component, For, NodeRef, Style, target } from "@rue/lumo";
import { moveUniqueItems, useRandomColorGenerator } from "@rue/utils";
import '../style.css'
import { EACH, INTERNAL_OP, Ionic } from "../../../../packages/quarky/src/ionic/Ionic";
import { instantUpdate, INTERNAL_RENDER, Ion, POSTLUDE, PRELUDE, queueInternalRender, queuePrelude, queueRender, queueTask, RENDER, SYNC, watch } from "@rue/quarky";
import { getActiveFlask } from "@rue/flask";
import { NodeRefs } from "../../../../packages/lumo/src/node/GetNodes";

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

type QItem = ReturnType<typeof IonicItem>


export function TestListSelectTransition() {

   const list = Ionic([
      { id: genId(), content: "frog" },
      { id: genId(), content: "robin" },
      { id: genId(), content: "fly" },
      { id: genId(), content: "swamp" },
   ], {
      [EACH]: { as: IonicItem }, // TODO: type

      insert(index: number) {
         const item = IonicItem({
            id: genId(),
            content: (Math.random() * 100).toString()
         })
         if (index === this.length) {
            this.push(item)
            return item;
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

   const selected = Ionic(new Set<QItem>(), {
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

   function insertItem(index: number) {
      const item = list.insert(index)
      queuePrelude(() =>
         transitionExisting(index)
      )
   }

   function moveSelectedItems(index: number) {
      moveUniqueItems(selected, list, index)
      queuePrelude(() =>
         transitionExisting()
      )
   }

   function removeItem(index: number) {
      mu: selected.delete(list[index] as QItem) // TODO: remove type-casting once Ionic is properly typed
      mu: list.remove(index);
      queuePrelude(() =>
         transitionExisting(index)
      )
   }

   function transitionExisting(removedIndex?: number) {
      console.log('+++itemDivs length', $itemDivs('length'))
      const rects: DOMRect[] = []
      const nodes: any[] = []
      for (let i = 0; i < itemDivs.length; i++) {
         if (i === removedIndex) {
            continue;
         }
         const node = itemDivs[i]
         console.log('%%% node', node, i)
         const rect = node.getBoundingClientRect()
         rects.push(rect)
         nodes.push(node)
      }

      queueRender(() => {
         console.warn('@$% transition existing')
         for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i]
            const last = node.getBoundingClientRect()
            const first = rects[i]
            const delta = first.top - last.top
            if (delta) {
               node.style.setProperty('transform', `translate(${first.left - last.left}px, ${delta}px)`)
               console.log('DELTA', first.top - last.top)
               requestAnimationFrame(() => {
                  queueTask(() => {
                     node.classList.add('transition-position')
                     node.style.setProperty('transform', `translate(${0}px, ${0}px)`)
                     node.addEventListener('transitionend', () => {
                        node.classList.remove('transition-position')
                        node.style.removeProperty('transform')
                     })
                  })
               })
            }
         }
      })
   }

   function transitionNew(node) {
      node.classList.add('animate-in')
      node.addEventListener('animationend', () => {
         node.classList.remove('animate-in')
      })
   }

   function transitionOut(node) {
      console.log('transition out')
      const rect = node.getBoundingClientRect()
      const clone = node.cloneNode(true)
      clone.style.setProperty('position', 'fixed')
      clone.style.setProperty('top', rect.top - 16 + 'px')
      clone.style.setProperty('left', rect.left + 'px')
      clone.style.setProperty('width', rect.width + 'px')
      clone.style.setProperty('height', rect.height + 'px')

      $container()?.appendChild(clone)

      clone.classList.add('animate-out')
      clone.addEventListener('animationend', () => {
         clone.classList.remove('animate-out')
         clone.remove()
      })
   }

   const $container = NodeRef('div')

   const itemDivs = []

   return component(
      <>
         <h1>hello world</h1>
         <button on:click={e => selected.clear()}>clear</button>
         <div style='display: grid; grid-template-columns: 1fr 1fr; width: 100vw'>
            <div style='width: 10vw'>
               <div on:click={e => insertItem(0)} style="background-color: gray; cursor: pointer">
                  +
               </div>
               <div ref={$container}>
                  {For(list, m => m.id, (item, $index) => (
                     <div
                        // ref={$itemDivs.by($index)}

                        ref={[itemDivs, $index]}
                        at:mounted={node => { transitionNew(node) }}
                        at:unmount={node => { transitionOut(node) }}
                     >
                        <div
                           on:click={e => !target('style.cursor:pointer') && selected.toggle((console.log('$index', $index()), item))}
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
                           <div on:click={e => { insertItem($index() + 1) }} style="background-color: gray; cursor: pointer">
                              +
                           </div>
                        </div>
                        <div on:click={e => moveSelectedItems($index() + 1)} style="background-color: white; cursor: pointer">
                           insert
                        </div>
                        {/* {Style`
                        .transition {
                           transition-timing-function: cubic-bezier(0, 1, 1, 1);
                           animation-duration: 150ms;
                        }
                     `} */}
                     </div>
                  ))}
               </div>

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
            {Style`
               .transition-position {
                  transition: transform 150ms ease-in-out;
               }


@keyframes fade-in {
   from {
      opacity: .25;
   }

   to {
      opacity: 1;
   }
}

@keyframes fade-out {
   from {
      opacity: 1;
   }

   to {
      opacity: 0;
   }
}

.animate-out {
   animation: fade-out 2ms ease-in;
}

.animate-in {
   animation: fade-in 2ms ease-in;
}
            `}
         </div>
      </>
   )
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



