import { component, template } from "@rue/luent"
import { ionic, ion, Ionic, watch } from "@rue/quarky"

// TODO:
// [x] private this access in methods and typing
// [x] native method override and 'super' access
// [x] mu vs encapsulated
// [x] get rid of .mu() --it's overkill
// [] deep mutable, an array of objects ... what if I want the array to be encapsulated but the objects to be mutable?
// [] readonly and reined, deep reined and readonly??
// [] deep ionize & inert() marker and inert map

export function CounterModelApp() {
   return (

      <>
         <TestMutableCounter></TestMutableCounter>
         <hr></hr>
         {/* <TestEncapsulatedCounter></TestEncapsulatedCounter>
         <hr></hr> */}
      </>

   )
}

export function TestMutableCounter() {

   const count = ionic({
      value: 0,
      increment() {
         this.value++
         console.log('increment', this.value)
      },
      decrement() {
         this.value--
      }
      // logSuper() {
      //    console.log('super')
      //    return 'olay!'
      // }
   })

   // watch(count, () => {
   //    // console.log('&&&& count model changed', count.value)
   // })


   // console.log('is it in count', 'increment' in count)

   const $doubleCount = ion(() =>count.value * 2)

   function increment() {
      count.value++
   }
   function decrement() {
      count.value--
   }

   // trackEffect(()=>{
   //    console.log('running ionic task', count.value)
   // })

   return (

      <>
         <h3>encapsulated model with methods</h3>
         <div>{(count.value)}</div>
         <div>{$doubleCount}</div>
         <div>The count is: {(count.value)}. Doubled: {$doubleCount}</div>
         <p>these should work</p>
         <button on:click={count.increment}>increment</button>
         <button on:click={count.decrement}>decrement</button>
         <hr></hr>
         <p>these should work</p>
         <button on:click={increment}>increment</button>
         <button on:click={decrement}>decrement</button>
         {/* <hr></hr>
         <button on:click={count.logCount}>log count</button>
         <button on:click={count.logSuper}>incr</button> */}
      </>
   )
}


export function TestEncapsulatedCounter() {

   const count = ionize({
      value: 0,
      increment() {
         this.value++
         return 0
      },
      decrement() {
         this.value--
         return 'for'
      },
      logSuper() {
         console.log('super')
         return 'olay!'
      }
   })

   console.log('is it in count', 'increment' in count)

   const $doubleCount = ion(() =>count.value * 2)

   function increment() {
      count.value++
   }
   function decrement() {
      count.value--
   }

   return (

      <>
         <h3>mutable ion with methods</h3>
         <div>{(count.value)}</div>
         <div>{$doubleCount}</div>
         {/* <div>The count is: {$count}. Doubled: {$doubleCount}</div> */}
         <p>these should work</p>
         <button on:click={count.increment}>increment</button>
         <button on:click={count.decrement}>decrement</button>
         <hr></hr>
         <p>these should BREAK</p>
         <button on:click={increment}>increment</button>
         <button on:click={decrement}>decrement</button>
         {/* <hr></hr>
         <button on:click={count.logCount}>log count</button>
         <button on:click={count.logSuper}>incr</button> */}
      </>
   )
}