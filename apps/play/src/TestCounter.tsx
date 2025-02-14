

// Tests:
// - simple signal
// - derived signal
// - derived signal in template
// - derived signal with memo

import { component } from "@rue/lumo"
import { ion, SYNC, watch } from "@rue/quarky"

export function TestCounter() {
   const $count = ion(0, {
      increment() {
         $count.state++
      },
      decrement() {
         $count.state--
      }
   })
   const $doubleCount = ion(() => $count() * 2)

   watch($count, (prevState) => {
      console.log(prevState, $count())
      $count.increment()
   }, {phase: SYNC})

   return component(
      <>
         <div>{$count}</div>
         <div>{$doubleCount}</div>
         {/* <div>The count is: {$count}. Doubled: {$doubleCount}</div> */}
         <button on:click={$count.increment}>increment</button>
         <button on:click={$count.decrement}>decrement</button>
      </>
   )
}


// export function TestCounterModel() {

//    const counter = ionize({
//       count: 0
//    }, {
//       increment(){
//          counter.count++
//       },
//       decrement(){
//          counter.count--
//       }
//    })

//    return component(
//       <>
//          <div>{counter.$count}</div>
//          <button on:click={counter.increment}>increment</button>
//          <button on:click={counter.decrement}>decrement</button>
//       </>
//    )
// }
