
// Tests:
// - simple signal
// - derived signal
// - derived signal in template
// - derived signal with memo


import { component, FromTag } from "@rue/lumo"
import { Ion, ion, ionicTask, ionize } from "@rue/quarky"

export function CounterApp() {
   return component(
      <>
         <TestCount mu:apple={$apple}></TestCount>
         {/* <hr></hr> */}
         <TestThisCount></TestThisCount>
         <hr></hr>
         {/* <TestImmutableCount></TestImmutableCount>
         <hr></hr> */}
         {/* <TestReadonlyMutableCount></TestReadonlyMutableCount> */}
         <hr></hr>
         {/* <TestReadonlyImmutableCount></TestReadonlyImmutableCount> */}
         {/* <hr></hr> */}
         {/* <TestReinedMutableCount></TestReinedMutableCount> */}
         <hr></hr>
         {/* <TestReinedImmutableCount></TestReinedImmutableCount> */}
         {/* <hr></hr> */}
         {/* <TestMutableNoMethodCount></TestMutableNoMethodCount> */}
      </>

   )
}


function TestIonize() {
   const obj = ionize({ message: 'hi' })

   function changeMessage() {
      console.log('message', obj.message)
      obj.message = 'bye'
      console.log('new message', obj.message)
   }

   return component(
      <>
         <div>{obj.$message}</div>
         <button on:click={changeMessage}>click</button>
      </>
   )
}

function TestIon() {
   const $message = ion('hi')

   function changeMessage() {
      console.log('message', $message.state)
      console.log('message (call)', $message())
      $message.state = 'bye'
      console.log('new message', $message.state)
      console.log('new message (call)', $message())
   }

   return component(
      <>
         <div>{$message}</div>
         <button on:click={changeMessage}>click</button>
      </>
   )
}

type TestCountInput = FromTag<{
   'mu?:apple': Ion<string>
}>

export function TestCount({ $apple, mu }: TestCountInput) {

   if (mu($apple)) $apple.state = "i"

   const $count = ion(0)

   const $active = ion(true)

   const $doubleCount = ion(() => {
      if ($active()) {
         return $count() * 2
      }
      return 'sorry'
   })

   function increment() {
      $count.state++
   }

   function decrement() {
      $count.state--
   }

   ionicTask(() => {
      console.log('running ionic task', $count())
   })

   return component(
      <>
         <h3>mutable ion</h3>
         <div>{$count}</div>
         <div>{$active}</div>
         <div>{$doubleCount}</div>
         <div>{($count() * 2)}</div>
         <hr></hr>
         <p>these should work</p>
         <button on:click={increment}>increment</button>
         <button on:click={decrement}>decrement</button>
         <button on:click={e => $active.state = !$active()}>toggle active</button>
      </>
   )
}

export function TestThisCount() {

   const $count = ion(0, {
      increment() {
         console.log('increment', this)
         this.state++
      },
      decrement() {
         this.state--
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
         <h3>mutable ion with methods</h3>
         <div>{$count}</div>
         <div>{$doubleCount}</div>
         {/* <div>The count is: {$count}. Doubled: {$doubleCount}</div> */}
         <p>mutate this: these should work</p>
         <button on:click={$count.increment}>increment</button>
         <button on:click={$count.decrement}>decrement</button>
         <hr></hr>
         <p>mutate $count: these should work</p>
         <button on:click={increment}>increment</button>
         <button on:click={decrement}>decrement</button>
      </>
   )
}


// export function TestImmutableCount() {

//    const $count = ion({
//       'count': 0
//    }, {
//       increment() {
//          console.log('increment', this)
//          this.count++
//       },
//       decrement() {
//          this.count--
//       }
//    })

//    const $doubleCount = ion(() => $count() * 2)

//    function increment() {
//       $count.state++
//    }
//    function decrement() {
//       $count.state--
//    }

//    return component(
//       <>
//          <h3>immutable ion with methods</h3>
//          <div>{$count}</div>
//          <div>{$doubleCount}</div>
//          {/* <div>The count is: {$count}. Doubled: {$doubleCount}</div> */}
//          <p>these should work</p>
//          <button on:click={$count.increment}>increment</button>
//          <button on:click={$count.decrement}>decrement</button>
//          <hr></hr>
//          <p>these should BREAK</p>
//          <button on:click={increment}>increment</button>
//          <button on:click={decrement}>decrement</button>
//       </>
//    )
// }


// export function TestReadonlyImmutableCount() {

//    const $count = asReadonlyIon(ion({
//       'count': 0
//    }, {
//       increment() {
//          console.log('increment', this)
//          this.count++
//       },
//       decrement() {
//          this.count--
//       }
//    }))

//    const $doubleCount = ion(() => $count() * 2)

//    function increment() {
//       $count.state++
//    }
//    function decrement() {
//       $count.state--
//    }

//    return component(
//       <>
//          <h3>readonly immutable ion with methods</h3>
//          <div>{$count}</div>
//          <div>{$doubleCount}</div>
//          {/* <div>The count is: {$count}. Doubled: {$doubleCount}</div> */}
//          <p>these should BREAK</p>
//          <button on:click={$count.increment}>increment</button>
//          <button on:click={$count.decrement}>decrement</button>
//          <hr></hr>
//          <p>these should BREAK</p>
//          <button on:click={increment}>increment</button>
//          <button on:click={decrement}>decrement</button>
//       </>
//    )
// }


// export function TestReadonlyMutableCount() {

//    const $count = asReadonlyIon(ion(0, {
//       increment() {
//          console.log('increment', this)
//          this.state++
//       },
//       decrement() {
//          this.state--
//       }
//    }))

//    const $doubleCount = ion(() => $count() * 2)

//    function increment() {
//       $count.state++
//    }
//    function decrement() {
//       $count.state--
//    }

//    return component(
//       <>
//          <h3>readonly mutable ion with methods</h3>
//          <div>{$count}</div>
//          <div>{$doubleCount}</div>
//          {/* <div>The count is: {$count}. Doubled: {$doubleCount}</div> */}
//          <p>these should BREAK</p>
//          <button on:click={$count.increment}>increment</button>
//          <button on:click={$count.decrement}>decrement</button>
//          <hr></hr>
//          <p>these should BREAK</p>
//          <button on:click={increment}>increment</button>
//          <button on:click={decrement}>decrement</button>
//       </>
//    )
// }


// export function TestReinedMutableCount() {

//    const $count = asReinedIon(ion(0, {
//       increment() {
//          console.log('**increment', this)
//          this.state++
//       },
//       decrement() {
//          this.state--
//       }
//    }), true, ['increment'])

//    console.log('increment in coutn', 'increment' in $count)
//    console.log('decrement in coutn', 'decrement' in $count)

//    const $doubleCount = ion(() => $count() * 2)

//    function increment() {
//       $count.state++
//    }
//    function decrement() {
//       $count.state--
//    }

//    return component(
//       <>
//          <h3>reined mutable ion with methods</h3>
//          <div>{$count}</div>
//          {/* <div>{$doubleCount}</div> */}
//          {/* <div>The count is: {$count}. Doubled: {$doubleCount}</div> */}
//          <button on:click={$count.increment}>increment</button> this should work
//          <button on:click={$count.decrement}>decrement</button> this should BREAK
//          <hr></hr>
//          <p>these should work</p>
//          <button on:click={increment}>increment</button>
//          <button on:click={decrement}>decrement</button>
//       </>
//    )
// }



// export function TestReinedImmutableCount() {

//    const $count = asReinedIon(ion({
//       'count': 0
//    }, {
//       increment() {
//          console.log('increment', this)
//          this.count++
//       },
//       decrement() {
//          this.count--
//       }
//    }), false, ['increment'])

//    const $doubleCount = ion(() => $count() * 2)

//    function increment() {
//       $count.state++
//    }
//    function decrement() {
//       $count.state--
//    }

//    return component(
//       <>
//          <h3>reined immutable ion with methods</h3>
//          <div>{$count}</div>
//          <div>{$doubleCount}</div>
//          {/* <div>The count is: {$count}. Doubled: {$doubleCount}</div> */}
//          <button on:click={$count.increment}>increment</button> this should work
//          <button on:click={$count.decrement}>decrement</button> this should BREAK
//          <hr></hr>
//          <p>these should BREAK</p>
//          <button on:click={increment}>increment</button>
//          <button on:click={decrement}>decrement</button>
//       </>
//    )
// }


// export function TestMutableNoMethodCount() {

//    const $count = asReinedIon(ion(0, {
//       increment() {
//          console.log('increment', this)
//          this.state++
//       },
//       decrement() {
//          this.state--
//       }
//    }), true, [])

//    const $doubleCount = ion(() => $count() * 2)

//    function increment() {
//       $count.state++
//    }
//    function decrement() {
//       $count.state--
//    }

//    return component(
//       <>
//          <h3>reined mutable ion, no methods</h3>
//          <div>{$count}</div>
//          <div>{$doubleCount}</div>
//          {/* <div>The count is: {$count}. Doubled: {$doubleCount}</div> */}
//          <p>these should BREAK</p>
//          <button on:click={e => $count.increment()}>increment</button>
//          <button on:click={e => $count.decrement()}>decrement</button>
//          <hr></hr>
//          <p>these should work</p>
//          <button on:click={increment}>increment</button>
//          <button on:click={decrement}>decrement</button>
//       </>
//    )
// }

export function TestCounterModel() {

   const counter = ionize({
      count: 0,
      increment() {
         this.count++
      },
      decrement() {
         this.count--
      }
   })

   const $doubleCount = ion(() => counter.count * 2)

   // watch(counter, ({ state }) => {
   //    console.log('changed', state)
   // }, { eager: true, phase: RENDER })

   return component(
      <>
         <div>{counter.$count}</div>
         <div>{$doubleCount}</div>
         <button on:click={counter.increment}>increment</button>
         <button on:click={counter.decrement}>decrement</button>
      </>
   )
}
