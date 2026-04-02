import { template, Else, ElseIf, If } from "@rue/luent";
import { Ion } from "@rue/quarky";

export function Counter() {
   const $count = Ion(0, {
      increment() {
         this.value++
      },
      decrement() {
         this.value--
      }
   })


   return template(
      <>
         <button on:click={e => $count.increment()}>+</button>
         <button on:click={e => $count.decrement()}>-</button>
         <div>{$count}</div>
         {If(($count() > 10),
            <div>I'm greater than 10</div>
         )}
         {ElseIf(($count() === 10),
            <div>I'm 10</div>
         )}
         {ElseIf(($count() < 0),
            <div>I'm negative :(</div>
         )}
         {Else(
            <div>I'm less than 10</div>
         )}
      </>
   )
}