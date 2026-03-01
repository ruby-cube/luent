import { template, For, listen, NodeRef, Style, target, css } from "@rue/lumo";
import { moveUniqueItems, useRandomColorGenerator } from "@rue/utils";
import './style.css'
import { Ion, queuePrelude, queueRender, queueTask, EACH, Ionic, as } from "@rue/quarky";

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


export function TestListSelectTransition() {

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

      // temporary till Transition API implemented
      queuePrelude(() =>
         transitionExisting(itemDivs, index)
      )
   }

   function removeItem(index: number) {
      selected.delete(list[index] as IonicItem) // TODO: remove type-casting once Ionic is properly typed
      list.remove(index);
   }

   function moveSelectedItems(index: number) {
      moveUniqueItems(selected, list, index)

      // temporary till Transition API implemented
      queuePrelude(() =>
         transitionExisting(itemDivs)
      )
   }


   listen(window, 'click', e => {
      if ((e.target as HTMLElement).closest('.list')) {
         return;
      }

      selected.clear()
   })

   // temporary till Transition API implemented
   const $container = NodeRef('div')
   const itemDivs: HTMLElement[] = []

   // {{ [m.list]: $active, '.': [m.dark, m.selectedList] }}

   return template(
      <>
         <h1>hello world</h1>
         <div style='display: grid; grid-template-columns: 1fr 1fr; place-items: center; align-items: start'>
            <div style='width: 20vw'>
               <div ref={$container} class='list' style="list-style-type: none;">
                  <div on:click={e => insertItem(0)} style="background-color: gray; cursor: pointer">
                     +
                  </div>
                  <div on:click={e => moveSelectedItems(0)} style="background-color: white; cursor: pointer">
                     insert
                  </div>
                  {For(list, m => m.id, (item, $index) => (
                     <div
                        ref={{ arr: itemDivs, i: $index }}
                        at:mounted={node => { transitionNew(node) }}
                        at:unmount={node => { animateOut(node, $container()!); transitionExisting(itemDivs, $index()) }}
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
      </>
   )
      .style(css`
         body {
            overflow-y: scroll
         }

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
      `)
}


const randomColor = useRandomColorGenerator()

let id = 0;
function genId() {
   return id++;
}

//#region transitions

export function transitionExisting(itemDivs: HTMLElement[], removedIndex?: number) {
   const rects: DOMRect[] = []
   const nodes: any[] = []
   for (let i = 0; i < itemDivs.length; i++) {
      if (i === removedIndex) {
         continue;
      }
      const node = itemDivs[i]
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

function transitionNew(node: HTMLElement) {
   node.classList.add('animate-in')
   node.addEventListener('animationend', () => {
      node.classList.remove('animate-in')
   })
}

function animateOut(node: HTMLElement, container: HTMLElement) {
   const rect = node.getBoundingClientRect()
   const clone = node.cloneNode(true) as HTMLElement
   clone.style.setProperty('position', 'fixed')
   clone.style.setProperty('top', rect.top - 16 + 'px')
   clone.style.setProperty('left', rect.left + 'px')
   clone.style.setProperty('width', rect.width + 'px')
   clone.style.setProperty('height', rect.height + 'px')

   container.appendChild(clone)

   clone.classList.add('animate-out')
   clone.addEventListener('animationend', () => {
      clone.classList.remove('animate-out')
      clone.remove()
   })
}



