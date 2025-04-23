import { component } from "@rue/lumo"
import { ion, ionize } from "@rue/quarky"

//TODO:
// [x] private this access in methods and typing
// [x] native method override and 'super' access
// [] mu vs encapsulated
// [] readonly and reined
// [] deep ionize & inert() marker and inert map

export function CounterModelApp() {
   return component(
      <>
         <TestMutableCounter></TestMutableCounter>
         <hr></hr>
      </>

   )
}

export function TestMutableCounter() {

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
      logSuper(){
         console.log('super')
         return 'olay!'
      }
   }, {
      incr(){
         this.value++
      },
      logCount() {
         console.log('logging count', this.value)
         this.doSomething()
         return 0
      },
      logSuper(){
         console.log('extendsion', this.super.logSuper())
      },
      doSomething() {
         console.log('doSomething')
         this.increment()
      }
   })

   console.log('is it in count', 'increment' in count)

   const $doubleCount = ion(() => count.value * 2)

   function increment() {
      count.value++
   }
   function decrement() {
      count.value--
   }

   return component(
      <>
         <h3>mutable ion with methods</h3>
         <div>{(count.value)}</div>
         <div>{$doubleCount}</div>
         {/* <div>The count is: {$count}. Doubled: {$doubleCount}</div> */}
         <p>these should work</p>
         <button on:click={count.increment}>increment</button>
         <button on:click={count.decrement}>decrement</button>
         <hr></hr>
         <p>these should work</p>
         <button on:click={increment}>increment</button>
         <button on:click={decrement}>decrement</button>
         <hr></hr>
         <button on:click={count.logCount}>log count</button>
         <button on:click={count.logSuper}>incr</button>
      </>
   )
}