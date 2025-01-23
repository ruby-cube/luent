import { component, For, fromTag, v, watchEffect } from "@rue/lumo";
import { ion, ionize, rein } from "@rue/quarky";



export function OverrideMethods() {

   const list = ionize([{ num: 1, increment() { } }, { num: 2, increment() { } }], {
      addItem(item: { num: number, increment: () => void }) {
         list.push(item);
      },
      splice(...args: Parameters<Array<any>['splice']>) {
         return list._splice(...args)
      },
   })

   const something = list.pop()


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
      for (const item of list) {
         console.log('item', item)
      }
   })

   const $count = ion({ count: 0 })

   const $reinedCount = rein($count)

   const reinedObj = rein({
      count: 0,
      setCount() { }
   })


   const sd = rein({ sol: { count: 0 } }, 'sol')

   const c = $reinedCount()

   console.log(list)

   const res = rein(list)
   const popped = res.splice(0, 1)

   res.filter((val, index) => {
      return true;
   })
   list.filter
   list.filter((val) => true)

   const $_list_ = '$:list'

   const $_dog_ = Symbol('$:dog')



   return component(
      <>
         {For(list, (item, $index) =>
            <p>{item!.num}</p>
         )}
         
         <PotterBlock count={rein(forest$, 'select')}></PotterBlock>
         <$--commons provide={{ [$_list_]: list }}>

         </$--commons>
         <button on:click={() => list.pop()}>pop</button>
         <button on:click={() => list.pop()}>pop</button>
      </>
   )
}

function PotterBlock(input = fromTag({ count: v<any> })) {
   return component(
      'hi'
   )
}

// exo

// readonly

// rein