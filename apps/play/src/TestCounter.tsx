
// Tests:
// - simple signal
// - derived signal
// - derived signal in template
// - derived signal with memo


import { component } from "@rue/lumo"
import { asReadonlyIon, asReinedIon, ion, ionize, isIon, SYNC, watch } from "@rue/quarky"
import { RENDER } from "../../../packages/lumo/src/render-cycle"

export function CounterApp() {
   return component(
      <>
         <TestMutableCount></TestMutableCount>
         <hr></hr>
         <TestImmutableCount></TestImmutableCount>
         <hr></hr>
         <TestReadonlyMutableCount></TestReadonlyMutableCount>
         <hr></hr>
         <TestReadonlyImmutableCount></TestReadonlyImmutableCount>
         <hr></hr>
         <TestReinedMutableCount></TestReinedMutableCount>
         <hr></hr>
         <TestReinedImmutableCount></TestReinedImmutableCount>
         <hr></hr>
         <TestMutableNoMethodCount></TestMutableNoMethodCount>
      </>

   )
}

export function TestSimpleCount() {

   const $count = ion(0)

   const $doubleCount = ion(() => $count() * 2)

   function increment() {
      $count.state++
   }
   function decrement() {
      $count.state--
   }

   return component(
      <>
         <h3>mutable ion with methods</h3>
         <div>{$count}</div>
         <div>{$doubleCount}</div>
         <hr></hr>
         <p>these should work</p>
         <button on:click={increment}>increment</button>
         <button on:click={decrement}>decrement</button>
      </>
   )
}


export function TestCount() {

   const $count = ion.mu(0)

   const $doubleCount = ion(() => $count() * 2)

   function increment() {
      $count.state++
   }
   
   function decrement() {
      $count.state--
   }

   return component(
      <>
         <h3>mutable ion with methods</h3>
         <div>{$count}</div>
         <div>{$doubleCount}</div>
         <hr></hr>
         <p>these should work</p>
         <button on:click={increment}>increment</button>
         <button on:click={decrement}>decrement</button>
      </>
   )
}

export function TestMutableCount() {

   const $count = ion.mu({
      'count': 0
   }, {
      increment() {
         console.log('increment', this)
         this.count++
      },
      decrement() {
         this.count--
      }
   })

   console.log('is it in count', 'increment' in $count)

   const $doubleCount = ion(() => $count() * 2, {increment(){}})

   function increment() {
      $count.state++
   }
   function decrement() {
      $count.state--
   }

   return component(
      <>
         <h3>mutable ion with methods</h3>
         <div>{$count}</div>
         <div>{$doubleCount}</div>
         {/* <div>The count is: {$count}. Doubled: {$doubleCount}</div> */}
         <p>these should work</p>
         <button on:click={$count.increment}>increment</button>
         <button on:click={$count.decrement}>decrement</button>
         <hr></hr>
         <p>these should work</p>
         <button on:click={increment}>increment</button>
         <button on:click={decrement}>decrement</button>
      </>
   )
}


export function TestImmutableCount() {

   const $count = ion({
      'count': 0
   }, {
      increment() {
         console.log('increment', this)
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
         <h3>immutable ion with methods</h3>
         <div>{$count}</div>
         <div>{$doubleCount}</div>
         {/* <div>The count is: {$count}. Doubled: {$doubleCount}</div> */}
         <p>these should work</p>
         <button on:click={$count.increment}>increment</button>
         <button on:click={$count.decrement}>decrement</button>
         <hr></hr>
         <p>these should BREAK</p>
         <button on:click={increment}>increment</button>
         <button on:click={decrement}>decrement</button>
      </>
   )
}


export function TestReadonlyImmutableCount() {

   const $count = asReadonlyIon(ion({
      'count': 0
   }, {
      increment() {
         console.log('increment', this)
         this.count++
      },
      decrement() {
         this.count--
      }
   }))

   const $doubleCount = ion(() => $count() * 2)

   function increment() {
      $count.state++
   }
   function decrement() {
      $count.state--
   }

   return component(
      <>
         <h3>readonly immutable ion with methods</h3>
         <div>{$count}</div>
         <div>{$doubleCount}</div>
         {/* <div>The count is: {$count}. Doubled: {$doubleCount}</div> */}
         <p>these should BREAK</p>
         <button on:click={$count.increment}>increment</button>
         <button on:click={$count.decrement}>decrement</button>
         <hr></hr>
         <p>these should BREAK</p>
         <button on:click={increment}>increment</button>
         <button on:click={decrement}>decrement</button>
      </>
   )
}


export function TestReadonlyMutableCount() {

   const $count = asReadonlyIon(ion.mu({
      'count': 0
   }, {
      increment() {
         console.log('increment', this)
         this.count++
      },
      decrement() {
         this.count--
      }
   }))

   const $doubleCount = ion(() => $count() * 2)

   function increment() {
      $count.state++
   }
   function decrement() {
      $count.state--
   }

   return component(
      <>
         <h3>readonly mutable ion with methods</h3>
         <div>{$count}</div>
         <div>{$doubleCount}</div>
         {/* <div>The count is: {$count}. Doubled: {$doubleCount}</div> */}
         <p>these should BREAK</p>
         <button on:click={$count.increment}>increment</button>
         <button on:click={$count.decrement}>decrement</button>
         <hr></hr>
         <p>these should BREAK</p>
         <button on:click={increment}>increment</button>
         <button on:click={decrement}>decrement</button>
      </>
   )
}


export function TestReinedMutableCount() {

   const $count = asReinedIon(ion.mu({
      'count': 0
   }, {
      increment() {
         console.log('**increment', this)
         this.count++
      },
      decrement() {
         this.count--
      }
   }), true, ['increment'])

   console.log('increment in coutn', 'increment' in $count)
   console.log('decrement in coutn', 'decrement' in $count)

   const $doubleCount = ion(() => $count() * 2)

   function increment() {
      $count.state++
   }
   function decrement() {
      $count.state--
   }

   return component(
      <>
         <h3>reined mutable ion with methods</h3>
         <div>{$count}</div>
         {/* <div>{$doubleCount}</div> */}
         {/* <div>The count is: {$count}. Doubled: {$doubleCount}</div> */}
         <button on:click={$count.increment}>increment</button> this should work
         <button on:click={$count.decrement}>decrement</button> this should BREAK
         <hr></hr>
         <p>these should work</p>
         <button on:click={increment}>increment</button>
         <button on:click={decrement}>decrement</button>
      </>
   )
}



export function TestReinedImmutableCount() {

   const $count = asReinedIon(ion({
      'count': 0
   }, {
      increment() {
         console.log('increment', this)
         this.count++
      },
      decrement() {
         this.count--
      }
   }), false, ['increment'])

   const $doubleCount = ion(() => $count() * 2)

   function increment() {
      $count.state++
   }
   function decrement() {
      $count.state--
   }

   return component(
      <>
         <h3>reined immutable ion with methods</h3>
         <div>{$count}</div>
         <div>{$doubleCount}</div>
         {/* <div>The count is: {$count}. Doubled: {$doubleCount}</div> */}
         <button on:click={$count.increment}>increment</button> this should work
         <button on:click={$count.decrement}>decrement</button> this should BREAK
         <hr></hr>
         <p>these should BREAK</p>
         <button on:click={increment}>increment</button>
         <button on:click={decrement}>decrement</button>
      </>
   )
}


export function TestMutableNoMethodCount() {

   const $count = asReinedIon(ion.mu({
      'count': 0
   }, {
      increment() {
         console.log('increment', this)
         this.count++
      },
      decrement() {
         this.count--
      }
   }), true, [])

   const $doubleCount = ion(() => $count() * 2)

   function increment() {
      $count.state++
   }
   function decrement() {
      $count.state--
   }

   return component(
      <>
         <h3>reined mutable ion, no methods</h3>
         <div>{$count}</div>
         <div>{$doubleCount}</div>
         {/* <div>The count is: {$count}. Doubled: {$doubleCount}</div> */}
         <p>these should BREAK</p>
         <button on:click={e => $count.increment()}>increment</button> 
         <button on:click={e => $count.decrement()}>decrement</button>
         <hr></hr>
         <p>these should work</p>
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
