import { mountIsland } from "luent"
import { ion } from "@luently/quarky"

/* 
Tests:
- Atomic ion reactivity
- Atomic ion methods
- Derivation ion reactivity
- text node update: single child
- text node update: two children - static + dynamic
*/

export function TestCounter() {

   const $count = ion(0, {
      increment() {
         this.value++
      },
      decrement() {
         this.value--
      }
   })

   const $doubleCount = ion(() => $count() * 2)

   return (
      <div>
         <div id='count'>{$count}</div>
         <div id='double-count'>x2 = {$doubleCount}</div>
         <hr></hr>
         <button on:click={() => $count.increment()}>+</button>
         <button on:click={() => $count.decrement()}>-</button>
      </div>
   )
}

if (__TEST__) mountIsland(TestCounter, '#root')