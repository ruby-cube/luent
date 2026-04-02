
// Tests:
// - simple signal
// - derived signal
// - derived signal in template
// - derived signal with memo


import { template, FromTag } from "@rue/lumo"
import { asIonic, Ion, Ionic, } from "@rue/quarky"

export function CounterApp() {
   return template(
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

   return template(
      <>
         <div>{obj.$message}</div>
         <button on:click={changeMessage}>click</button>
      </>
   )
}

function TestIon() {
   const $message = Ion('hi')

   function changeMessage() {
      console.log('message', $message.value)
      console.log('message (call)', $message())
      $message.value = 'bye'
      console.log('new message', $message.value)
      console.log('new message (call)', $message())
   }

   return template(
      <>
         <div>{$message}</div>
         <button on:click={changeMessage}>click</button>
      </>
   )
}

type TestCountInput = FromTag<{
   'mu?:apple': Ion<string>
}>

export function TestCount() {

   const $count = Ion(0)

   const $active = Ion(true)

   const $doubleCount = Ion(() => {
      if ($active()) {
         return $count() * 2
      }
      return 'sorry'
   })

   function increment() {
      $count.value++
   }

   function decrement() {
      $count.value--
   }

   // queueIonicTask(() => {
   //    console.log('running ionic task', $count())
   // })

   return template(
      <>
         <h3>mutable ion</h3>
         <div>{$count}</div>
         <div>{$active}</div>
         <div>{$doubleCount}</div>
         <div>{($count() * 2)}</div>
         {/* <hr></hr> */}
         {/* <p>these should work</p> */}
         <button on:click={increment}>increment</button>
         <button on:click={decrement}>decrement</button>
         <button on:click={e => $active.value = !$active()}>toggle active</button>
      </>
   )
}

export function TestThisCount() {

   const $count = Ion(0, {
      increment() {
         console.log('increment', this)
         this.value++
      },
      decrement() {
         this.value--
      }
   })

   const $doubleCount = Ion(() => $count() * 2)

   function increment() {
      $count.value++
   }
   function decrement() {
      $count.value--
   }

   return template(
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

//    const $count = Ion({
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

//    const $doubleCount = Ion(() =>$count() * 2)

//    function increment() {
//       $count.value++
//    }
//    function decrement() {
//       $count.value--
//    }

//    return template(
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

//    const $count = asReadonlyIon(Ion({
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

//    const $doubleCount = Ion(() =>$count() * 2)

//    function increment() {
//       $count.value++
//    }
//    function decrement() {
//       $count.value--
//    }

//    return template(
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

//    const $count = asReadonlyIon(Ion(0, {
//       increment() {
//          console.log('increment', this)
//          this.value++
//       },
//       decrement() {
//          this.value--
//       }
//    }))

//    const $doubleCount = Ion(() =>$count() * 2)

//    function increment() {
//       $count.value++
//    }
//    function decrement() {
//       $count.value--
//    }

//    return template(
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

//    const $count = asReinedIon(Ion(0, {
//       increment() {
//          console.log('**increment', this)
//          this.value++
//       },
//       decrement() {
//          this.value--
//       }
//    }), true, ['increment'])

//    console.log('increment in coutn', 'increment' in $count)
//    console.log('decrement in coutn', 'decrement' in $count)

//    const $doubleCount = Ion(() =>$count() * 2)

//    function increment() {
//       $count.value++
//    }
//    function decrement() {
//       $count.value--
//    }

//    return template(
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

//    const $count = asReinedIon(Ion({
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

//    const $doubleCount = Ion(() =>$count() * 2)

//    function increment() {
//       $count.value++
//    }
//    function decrement() {
//       $count.value--
//    }

//    return template(
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

//    const $count = asReinedIon(Ion(0, {
//       increment() {
//          console.log('increment', this)
//          this.value++
//       },
//       decrement() {
//          this.value--
//       }
//    }), true, [])

//    const $doubleCount = Ion(() =>$count() * 2)

//    function increment() {
//       $count.value++
//    }
//    function decrement() {
//       $count.value--
//    }

//    return template(
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

   const counter = asIonic({
      count: 0,
      increment() {
         this.count++
      },
      decrement() {
         this.count--
      }
   })

   console.log('&&&', counter.$count)

   const $doubleCount = Ion(() => counter.count * 2)

   // watch(counter, ({ state }) => {
   //    console.log('changed', state)
   // }, { eager: true, phase: RENDER })

   return template(
      <>
         <div>{counter.$count}</div>
         <div>{$doubleCount}</div>
         <button on:click={counter.increment}>increment</button>
         <button on:click={counter.decrement}>decrement</button>
      </>
   )
}
