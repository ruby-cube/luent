import { Component, For, watchEffect } from "@rue/lumo";
import { ionize } from "@rue/quarky";

export function OverrideMethods() {

   const list$ = ionize([{ num: 1 }, { num: 2 }, { num: 3 }, { num: 4 }, { num: 5 }], {
      addItem(item: { num: number }) {
         list$.push(item);
      },
      pop() {
         console.log("what's popping")
         list$._pop()
      }
   })

   watchEffect(() => {
      for (const item of list$) {
         console.log('item', item)
      }
   })

   console.log(list$)

   return Component(
      <>
         {For(list$, (item, $index) =>
            <p>{item!.num}</p>
         )}
         <button on:click={() => list$.pop()}>pop</button>
         <button on:click={() => list$._pop()}>pop</button>
      </>
   )
}


// exo

// readonly

// rein