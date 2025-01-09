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

   const $aActive = ion(false, {
      toggle() {
         $aActive.value = !$aActive.value
      }
   })



   const $bActive = ion(false, {
      toggle() {
         $bActive.value = !$bActive.value
      }
   })


   const $cActive = ion(false, {
      toggle() {
         $cActive.value = !$cActive.value
      }
   })


   const $dActive = ion(false, {
      toggle() {
         $dActive.value = !$dActive.value
      }
   })



   return component(
      <article>
         {/* <div>{$count}</div>
         <div>{$doubleCount}</div>
         <button on:click={$count.increment}>+</button>
         <button on:click={$count.decrement}>-</button>
         {$if($doubleCount() > 3, 'create',
            <p>doublecount is greater than 3!</p>
         )}
         {$if($doubleCount,'mount',
            <p>doublecount is greater than 0!</p>
         )}
         {$if($count() > 3,'mount',
            <p>count is greater than 3!</p>
         )}
         {$if($count,'show',
            <p>count is greater than 0!</p>
         )} */}

         {/* <div>{$count}</div> */}
         {/* <div>{$doubleCount}</div> */}
         <button on:click={$aActive.toggle}>toggle A (mount)</button>
         <button on:click={$bActive.toggle}>toggle B (create)</button>
         {/* <button on:click={$cActive.toggle}>toggle C (mount)</button>
         <button on:click={$dActive.toggle}>toggle D (show)</button> */}
         {/* <button on:click={$count.decrement}>-</button> */}
         {$if($aActive, 'mount',
            <p>A ACTIVE</p>
         )}
         {$if($bActive, 'create',
            <p>B ACTIVE</p>
         )}
         {/* {$if($cActive, 'mount',
            <p>C ACTIVE</p>
         )}
         {$if($dActive, 'show',
            <p>D ACTIVE</p>
         )} */}



      </article>
   )
}