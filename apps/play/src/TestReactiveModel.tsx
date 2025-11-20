import { component, For, target } from "@rue/lumo";
import { moveUniqueItems, useRandomColorGenerator } from "@rue/utils";
import './style.css'
import { EACH, Ionic } from "../../../packages/quarky/src/ionic/Ionic";


const randomColor = useRandomColorGenerator()
let id = 4;

function genId() {
   return id++;
}


// const $count = Ion(0)
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
      console.log('being remove ==============', index)
      this.splice(index, 1);
      console.log('end remove ==============', index)
   }

   changeContent(index: number) {
      const item = this[index];
      item.content = 'something else'
   }
}

class Selected<T> extends Set<T> {
   toggle(item: T) {
      if (this.has(item)) {
         this.delete(item)
      }
      else {
         this.add(item)
      }
   }
}

export function List(

) {
   // const frog = ionize({ id: 0, content: "frog" })
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
   const list = Ionic(new ItemList(
      { id: 0, content: "frog" },
      { id: 1, content: "robin" },
      { id: 2, content: "fly" },
      { id: 3, content: "swamp" }
   ), { [EACH]: { as: Ionic } })

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

   console.log('$$$ values vs entries', [][Symbol.iterator].constructor)

   // FIX:
   const ionizedValues = Ionic(list.values())
   for (const value of ionizedValues) {
      console.log('$$$ value of ionized values()', value)
   }




   const selected = Ionic(new Selected<Item>())

   // function toggleSelect(item: typeof list[number]) {
   //    // update(() => {
   //    if (selected.has(item)) {
   //       selected.delete(item)
   //    }
   //    else {
   //       selected.add(item)
   //    }
   //    // }, { lazy: 100 })
   // }

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

   // try {
   //    console.log('has it?', selected.has(0))
   // }
   // catch (err) {
   //    console.error('EEP', err)
   // }

   // toRaw(selected).add({id: '', content: ''})

   // const vals = selected.values()
   // Array.from(toRaw(selected))

   function moveSelectedItems(index: number) {
         moveUniqueItems(selected, list, index)
   }

   function removeItem(index: number) {
      selected.delete(list[index])
      list.remove(index);
   }

   return component(
      <>
         <h1>hello world</h1>
         <div on:click={e => list.insert(0)} style="background-color: gray; cursor: pointer">
            insert!
         </div>

         {For(list, m => m.id, (item, $index) => (
            <div on:click={e => !target('style.cursor:pointer') && selected.toggle(item)}
               style={{
                  backgroundColor: randomColor.get(),
                  outline: (selected.has(item) ? 'thick solid blue' : 'unset'),
               }}>
               <p on:click={e => removeItem($index())} style="cursor: pointer">
                  X
               </p>

               <li on:click={e => responsive(() => list.changeContent($index()))}>
                  {(item.content)}
               </li>
               <p>{$index}</p>
               <div on:click={e => responsive(() => list.insert($index() + 1))} style="background-color: gray; cursor: pointer">
                  insert
               </div>
               <div on:click={e => moveSelectedItems($index() + 1)} style="background-color: white; cursor: pointer">
                  insert
               </div>
            </div>
         ))}

         <button on:click={e => responsive(() => selected.clear())}>clear</button>
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




function responsive(fn: () => unknown) {
   return fn()
   // return update(fn, {timeMargin: 100})
}