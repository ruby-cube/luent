import { template, createRoot } from "@rue/luent"
import { Ion } from "@rue/quarky"

/* 
Tests:
- Atomic ion reactivity
- Atomic ion methods
- Derivation ion reactivity
- text node update: single child
- text node update: two children - static + dynamic
*/

export function TestCounter() {

   const $count = Ion(0, {
      increment() {
         this.value++
      },
      decrement() {
         this.value--
      }
   })

   const $doubleCount = Ion(() => $count() * 2)

   return template(
      <div>
         <div id='count'>{$count}</div>
         <div id='double-count'>x2 = {$doubleCount}</div>
         <hr></hr>
         <button on:click={e => $count.increment()}>+</button>
         <button on:click={e => $count.decrement()}>-</button>
      </div>
   )
}

if (__TEST__) createRoot(TestCounter).mount('#root')