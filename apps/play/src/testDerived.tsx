import { $if, component, watch } from "@rue/lumo";
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
      <>
         <div>{$count}</div>
         <div>{$doubleCount}</div>
         <button on:click={$count.increment}>+</button>
         <button on:click={$count.decrement}>-</button>
         {/* {$if($count,
            <p>count is greater than 0!</p>
         )}
         {$if($doubleCount,
            <p>doublecount is greater than 0!</p>
         )}
         {$if($count() > 3,
            <p>count is greater than 3!</p>
         )}
         {$if($doubleCount() > 3,
            <p>doublecount is greater than 3!</p>
         )} */}
      </>
   )
}