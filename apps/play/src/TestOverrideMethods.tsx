import { Component, For, fromTag, v, watchEffect } from "@rue/lumo";
import { ionize, rein } from "@rue/quarky";



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

   const forest$ = ionize({
      leaves: [0],
      selected: true,
      select() {

      }
   }, {
      setLeaves() {

      },
      select(dosomthing: any) {
         return true;
      }
   })

   watchEffect(() => {
      for (const item of list$) {
         console.log('item', item)
      }
   })

   const all_props = true

   console.log(list$)

   const res = rein(forest$)

   return Component(
      <>
         {For(list$, (item, $index) =>
            <p>{item!.num}</p>
         )}
         <PotterBlock count={rein(forest$, 'select')}></PotterBlock>
         <button on:click={() => list$.pop()}>pop</button>
         <button on:click={() => list$._pop()}>pop</button>
      </>
   )
}

function PotterBlock(input = fromTag({ count: v<any> })) {
   return Component(
      'hi'
   )
}

// exo

// readonly

// rein