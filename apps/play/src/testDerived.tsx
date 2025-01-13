import { $if, component, watch, $else, $elseif } from "@rue/lumo";
import { ion } from "@rue/quarky";

export function TestDerivedConditional() {
   const $count = ion(0, {
      increment() {
         $count.state++
      },
      decrement() {
         $count.state--
      }

   })
   const $doubleCount = ion(() => $count() * 2)
   const $isGreaterThanOne = ion(() => $doubleCount() > 1)
   watch($isGreaterThanOne, () => {
      console.log('yes'!)
   })

   const $aActive = ion(true, {
      toggle() {
         $aActive.state = !$aActive.state
      }
   })



   const $bActive = ion(true, {
      toggle() {
         $bActive.state = !$bActive.state
      }
   })


   const $cActive = ion(false, {
      toggle() {
         $cActive.state = !$cActive.state
      }
   })


   const $dActive = ion(false, {
      toggle() {
         $dActive.state = !$dActive.state
      }
   })



   return component(
      <article>
         <div>{$count}</div>
         <div>{$doubleCount}</div>
         <button on:click={$count.increment}>+</button>
         <button on:click={$count.decrement}>-</button>
         {$if($doubleCount() > 3, 'create',
            <p>doublecount is greater than 3!</p>
         )}
         {$if($doubleCount() > 0, 'mount',
            <p>doublecount is greater than 0!</p>
         )}
         {$if($count() > 3, 'mount',
            <p>count is greater than 3!</p>
         )}
         {$if($count() > 0, 'show',
            <p>count is greater than 0!</p>
         )}

         {/* <div>{$count}</div> */}
         {/* <div>{$doubleCount}</div> */}
         <button on:click={$aActive.toggle}>toggle A (mount)</button>
         <button on:click={$bActive.toggle}>toggle B (create)</button>
         {/* <button on:click={$cActive.toggle}>toggle C (mount)</button>
         <button on:click={$dActive.toggle}>toggle D (show)</button> */}
         {/* <button on:click={$count.decrement}>-</button> */}
         {$if($aActive, 'create',
            <p>A ACTIVE</p>
         )}
         {$elseif($bActive, 'mount',
            <p>A GONE f</p>
         )}
         {$else('show',
            <p>A GONE</p>
         )}
         {$if($bActive, 'create',
            <p>B ACTIVE</p>
         )}
         {$else('create',
            <p>B GONE</p>
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