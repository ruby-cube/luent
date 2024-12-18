import { Component, For, fromTag, v, watchEffect } from "@rue/lumo";
import { ion, ionize, rein } from "@rue/quarky";



export function OverrideMethods() {

   const list$ = ionize([{ num: 1, increment(){} }, { num: 2, increment(){} }], {
      // pop: true,
      addItem(item: { num: number, increment: ()=>void }) {
         list$.push(item);
      },
      pop(){
         return list$._pop()
      }
   })

   const something = list$.pop()

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

   const $count = ion({count: 0})

   const $reinedCount = rein($count)

   const reinedObj = rein({
      count: 0,
      setCount(){}
   })


   const sd = rein({sol: {count: 0}}, 'sol')

   const c = $reinedCount()

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