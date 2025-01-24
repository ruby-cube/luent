import { If, component, Else, ElseIf } from "@rue/lumo";
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
         <div>{$count() + 1}</div>

         <div>{[$count() + 1]}</div>

         <div>{$doubleCount()}</div>
         <div>{$doubleCount}</div>
         <div>{$=>frog.name}</div>
         <button on:click={$count.increment} class={pref + $activeState()}>+</button>
         <button on:click={$count.decrement}>-</button>
         {If($doubleCount() > 3, 'create',
            <p>doublecount is greater than 3!</p>
         )}
         {If($doubleCount() > 0, 'mount',
            <p>doublecount is greater than 0!</p>
         )}
         {If($count() > 3, 'mount',
            <p>count is greater than 3!</p>
         )}
         {If($count() > 0, 'show',
            <p>count is greater than 0!</p>
         )}

         {If([$active],
            <p>doublecount is greater than 3!</p>
         )}
         {If($doubleCount() > 3,
            <p>doublecount is greater than 3!</p>
         )}
         {If($doubleCount() > 0, 'mount',
            <p>doublecount is greater than 0!</p>
         )}
         {If($count() > 3, 'mount',
            <p>count is greater than 3!</p>
         )}
         {If($count() > 0, 'show',
            <p>count is greater than 0!</p>
         )}

         {If(($doubleCount() > 3), 'create',
            <p>doublecount is greater than 3!</p>
         )}
         {If($doubleCount() > 0, 'mount',
            <p>doublecount is greater than 0!</p>
         )}
         {If(($count() > 3), 'mount',
            <p>count is greater than 3!</p>
         )}
         {If(($count() > 0), 'show',
            <p>count is greater than 0!</p>
         )}

         <vvv:mount />
         {If($doubleCount() > 3, 'create',
            <p>doublecount is greater than 3!</p>
         )}
         {If($doubleCount() > 0, 'mount',
            <p>doublecount is greater than 0!</p>
         )}
         {If($count() > 3, 'mount',
            <p>count is greater than 3!</p>
         )}
         {If($count() > 0, 'show',
            <p>count is greater than 0!</p>
         )}

         {/* <div>{$count}</div> */}
         {/* <div>{$doubleCount}</div> */}
         <button on:click={e => $aActive.toggle()}>toggle A (mount)</button>
         <button on:click={$bActive.toggle}>toggle B (create)</button>
         {/* <button on:click={$cActive.toggle}>toggle C (mount)</button>
         <button on:click={$dActive.toggle}>toggle D (show)</button> */}
         {/* <button on:click={$count.decrement}>-</button> */}
         {If($aActive, 'create',
            <p>A ACTIVE</p>
         )}
         {ElseIf($bActive, 'mount',
            <p>A GONE f</p>
         )}
         {Else('show',
            <p>A GONE</p>
         )}
         {If($bActive, 'create',
            <p>B ACTIVE</p>
         )}
         {Else('create',
            <p>B GONE</p>
         )}
         {/* {If($cActive, 'mount',
            <p>C ACTIVE</p>
         )}
         {If($dActive, 'show',
            <p>D ACTIVE</p>
         )} */}



      </article>
   )
}