
// Tests:
// - simple signal
// - derived signal
// - derived signal in template
// - derived signal with memo


import { component } from "@rue/lumo"
import { ion, ionize, SYNC, watch } from "@rue/quarky"
import { RENDER } from "../../../packages/lumo/src/render-cycle"

export function TestCounter() {

   const $count = ion.mu({
      'count': 0
   }, {
      increment() {
         this.count++
      },
      decrement() {
         this.count--
      }
   })

   const $doubleCount = ion(() => $count() * 2)

   function increment() {
      $count.state++
   }
   function decrement() {
      $count.state--
   }

   return component(
      <>
         <div>{$count}</div>
         <div>{$doubleCount}</div>
         {/* <div>The count is: {$count}. Doubled: {$doubleCount}</div> */}
         <button on:click={e => $count.increment()}>increment</button>
         <button on:click={e => $count.decrement()}>decrement</button>
         <hr></hr>
         <button on:click={increment}>increment</button>
         <button on:click={decrement}>decrement</button>
      </>
   )
}


// export function TestCounterModel() {

//    const counter = ionize({
//       count: 0
//    }, {
//       increment() {
//          counter.count++
//       },
//       decrement() {
//          counter.count--
//       }
//    })

//    watch(counter, ({ state }) => {
//       console.log('changed', state)
//    }, { eager: true, phase: RENDER })

//    return component(
//       <>
//          <div>{counter.$count}</div>
//          <button on:click={counter.increment}>increment</button>
//          <button on:click={counter.decrement}>decrement</button>
//       </>
//    )
// }
