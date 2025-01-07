import { $if, component, watch, $else } from "@rue/lumo";
import { ion } from "@rue/quarky";

export function TestDerivedConditional() {
   const $count = ion(0, {
      increment() {
         $count.value++
      },
      decrement() {
         $count.value--
      }

   })
   const $doubleCount = ion(() => $count() * 2)
   const $isGreaterThanOne = ion(() => $doubleCount() > 1)
   watch($isGreaterThanOne, () => {
      console.log('yes'!)
   })

   return component(
      <article>
         <div>{$count}</div>
         <div>{$doubleCount}</div>
         <button on:click={$count.increment}>+</button>
         <button on:click={$count.decrement}>-</button>
         {$if($doubleCount() > 3, 'mount',
            <p>doublecount is greater than 3!</p>
         )}
         {$if($doubleCount,'mount',
            <p>doublecount is greater than 0!</p>
         )}
         {/* {$else('show',
            <p>nothing here</p>
         )} */}
         {/* {$if($count() > 3,'mount',
            <p>count is greater than 3!</p>
         )}
         {$if($count,'show',
            <p>count is greater than 0!</p>
         )} */}
   
      </article>
   )
}