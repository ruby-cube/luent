import { NodesRef, component, If, Else, For, NodeRef, target } from "@rue/lumo";
import { moveUniqueItems, useRandomColorGenerator } from "@rue/utils";
import { ion, __addDevName, ionize, toRaw, watch, FlattenMaybeIonized, IsMaybeIonized, Ionized, ToRaw, ToRawItems } from "@rue/quarky";
import { enlistIonizedMethods } from "../../../packages/quarky/src/ionized/IonizedMethods";
import { trackModel } from "../../../packages/quarky/src/ionized/OpDefinitions";
import { Glass, IsRedundantUnion } from "@rue/types";


const randomColor = useRandomColorGenerator()
let id = 4;

function genId() {
   return id++;
}


// const $count = ion(0)
// watch($=(doubleCount => $count() + 2), () => {  

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
// const frog$$=ionize(frog)

// const q = frog$$.qualities
// const qual$$=frog$$.getQualitiesB()
// const qual = frog.getQualitiesB()

class Frog {
   name = 'kermit'
   setName() {

   }
}

// Ionized<(Ionized<{
//    id: number;
//    content: string;
// }, {}> | {
//    id: number;
//    content: string;
// })[], {}>

// Ionized<{
//    id: number;
//    content: string;
// }[], {}>

// (Ionized<{
//    id: number;
//    content: string;
// }, {}> | Ionized<Ionized<{
//    id: number;
//    content: string;
// }, {}>, {}>)[]

type Froggy = {
   name?: string
}

interface Item {
   id: number, content: string
}

class ItemList extends Array<Item> {

   insert(index: number) {
      if (index === this.length) {
         this.push({
            id: genId(),
            content: (Math.random() * 100).toString(),
         })
      }
      else
         this.splice(index, 0, {
            id: genId(),
            content: (Math.random() * 100).toString(),
         })
   }

   remove(index: number) {
      this.splice(index, 1);
   }

   changeContent(index: number) {
      const item = this[index];
      item.content = 'something else'
   }
}

export function List(

) {
   const frog = ionize({ id: 0, content: "frog" })
   // const mixed = [
   //    frog,
   //    { id: 1, content: "robin" },
   //    { id: 2, content: "fly" },
   //    { id: 3, content: "swamp" }
   // ]
   // type B = typeof mixed extends Array<infer I> ? ToRaw<I> : 'n'
   // type A = typeof mixed extends Array<infer I> ? IsRedundantUnion<ToRaw<I>> extends true ? 'yes' : 'no' : 'no'
   // // {[K in keyof ToRaw<I>]: ToRaw<I>[K]}[]  : never
   // // IsMaybeIonized<I> extends true ? 'yeah' : 'no' : 'nah'
   const list = ionize(
      new ItemList(
      // [
      // frog,
      { id: 0, content: "frog" },
      { id: 1, content: "robin" },
      { id: 2, content: "fly" },
      { id: 3, content: "swamp" }
   // ])
   ))
   console.log('$$$ list values', list.values().next())
   console.log('$$$ list iterator', list[Symbol.iterator])

   const values = list.values()
   for (const value of values) {
      console.log('$$$ value', value)
   }

   for (const value of list) {
      console.log('$$$ value of list', value)
   }

   console.log('$$$ values vs entries', [][Symbol.iterator].constructor)

   const ionizedValues = ionize(list.values())
   for (const value of ionizedValues) {
      console.log('$$$ value of ionized values()', value)
   }
   // console.log('raw list', toRaw(list))
   // console.log([...list])



   const selected = ionize(new Set())

   function toggleSelect(item: typeof list[number]) {
      console.log('$$$ selected', selected)
      if (selected.has(item)) {
         selected.delete(item)
      }
      else {
         selected.add(item)
      }
   }

   // const selectedB = new IonizedSet(list, {
   //    toggle(item: typeof list[number]) {
   //       console.log('$$$ selected', selected)
   //       if (selected.has(item)) {
   //          selected.delete(item)
   //       }
   //       else {
   //          selected.add(item)
   //       }
   //    }
   // })

   try {
      console.log('has it?', selected.has(0))
   }
   catch (err) {
      console.error('EEP', err)
   }

   // toRaw(selected).add({id: '', content: ''})

   const vals = selected.values()
   Array.from(toRaw(selected))

   function moveSelectedItems(index: number) {
      moveUniqueItems(selected, list, index)
   }

   function removeItem(index: number) {
      selected.delete(list[index])
      list.remove(index);
   }

   watch(list, () => {
      console.log('#$% list changed!!')
   }, { sync: true })

   return component(
      <>
         <h1>hello world</h1>
         <div on:click={e => list.insert(0)} style="background-color: gray; cursor: pointer">
            insert!
         </div>

         {For(list, m => m.id, (item, $index) => (console.log('rendering', item, item.content, $index()),
            <div on:click={e => !target('style.cursor:pointer') && toggleSelect(item)}
               style={{
                  backgroundColor: randomColor.get(),
                  outline: (selected.has(item) ? 'thick solid blue' : 'unset'),
               }}>
               <p on:click={e => removeItem($index())} style="cursor: pointer">
                  X
               </p>

               <li on:click={e => list.changeContent($index())}>
                  {item.$content}
               </li>
               <p>{$index}</p>
               <div on:click={e => list.insert($index() + 1)} style="background-color: gray; cursor: pointer">
                  insert
               </div>
               <div on:click={e => moveSelectedItems($index() + 1)} style="background-color: white; cursor: pointer">
                  insert
               </div>
            </div>
         ))}

         <button on:click={e => selected.clear()}>clear</button>
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


class Selected extends Set<any> {
   toggle(item: any) {
      if (this.has(item)) this.delete(item)
      this.add(item)
   }
}