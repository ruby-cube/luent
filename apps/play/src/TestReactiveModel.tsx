import { NodesRef, Component, If, Else, For, NodeRef, target } from "@rue/lumo";
import { moveUniqueItems, useRandomColorGenerator } from "@rue/utils";
import { ion, __addDevName, DerivedIon, ionize, isIonicModel } from "../../../packages/quarky/src";
import { watch } from "../../../packages/lumo/src/watch/watchAndPreserve";
import { META } from "../../../packages/quarky/src/ReactiveEntity";
import { getFlask } from "@rue/flask";


const randomColor = useRandomColorGenerator()
let id = 4;

function genId() {
   return id++;
}


// const $count = ion(0)
// watch($(doubleCount => $count() + 2), () => {  

// })


// type RedefineReturn <P, M extends string, R extends >= <T extends Frog>(this: T, ...args: Parameters<Frog['getQualitiesB']>) => T["qualities"]

// const blub = {
//     getQualities<T extends Frog>(this: T): T['qualities'] {
//         return this.qualities;
//     }
// }

// type Star = {
//     fish: () => DeepReactiveModel<Frog>['qualities']
// } & ThisType<DeepReactiveModel<Frog>>

// const star: Star = {
//     fish() {
//         return this.qualities
//     }
// }

// const something = star.fish()


// const frog = new Frog() as FrogB
// const frog$$ = ionize(frog)

// const q = frog$$.qualities
// const qual$$ = frog$$.getQualitiesB()
// const qual = frog.getQualitiesB()



export function List(

) {
   console.log('hey')
   const $list = ionize([
      { id: 0, content: "frog" },
      { id: 1, content: "robin" },
      { id: 2, content: "fly" },
      { id: 3, content: "swamp" }
   ], {
      insert(index: number) {
         $list.splice(index, 0, {
            id: genId(),
            content: (Math.random() * 100).toString(),
         })
      },
      remove(index: number) {
         $list.splice(index, 1);
      },
      changeContent(index: number) {
         console.log("changing content")
         const $item = $list[index];
         $item.content = 'something else'
      }
   })



   const $selected = ionize(new Set(), {
      toggle(item: typeof $list[number]) {
         if ($selected.has(item)) {
            $selected.delete(item)
         }
         else {
            $selected.add(item)
         }
      }
   })

   function moveSelectedItems(index: number) {
      moveUniqueItems($selected, $list, index)
   }

   function removeItem(index: number) {
      $selected.delete($list[index])
      $list.remove(index);
   }



   return Component(
      <>
         <h1>hello world</h1>
         <div on:click={e => $list.insert(0)} style="background-color: gray; cursor: pointer">
            insert!
         </div>
    
         {For($list, o => o.id, ($item, $index) =>
            <div on:click={e => !target(e, 'style.cursor:pointer') && $selected.toggle($item)}
               style={[
                  `background-color: ${randomColor.get()}`,
                  o => { o.outline = $selected.has($item) ? 'thick solid blue' : '' }
               ]}>
               <p on:click={e => removeItem($index())}
                  style="cursor: pointer"
               >
                  X
               </p>

               <li on:click={e => $list.changeContent($index())}>
                  {() => $item.content}
               </li>
               <p>{$index}</p>
               <div on:click={e => $list.insert($index() + 1)}
                  style="background-color: gray; cursor: pointer"
               >
                  insert
               </div>
               <div on:click={e => moveSelectedItems($index() + 1)}
                  style="background-color: white; cursor: pointer"
               >
                  insert
               </div>
            </div>
         )}

         <button on:click={e => $selected.clear()}>clear</button>
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
      //         on:click={[increment, { until: onMounted }]}
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
