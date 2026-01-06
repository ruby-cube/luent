import { If, component, Else, ElseIf } from "@rue/lumo";
import { Ion, ionic } from "@rue/quarky";

export function TestDerivedConditional() {
   const $count = Ion(0, {
      increment() {
         this.value++
      },
      decrement() {
         this.value--
      }

   })
   const $doubleCount = Ion(() =>$count() * 2)

   const $aActive = Ion(true, {
      toggle() {
         $aActive.value = !$aActive.value
      }
   })

   const $bActive = Ion(true, {
      toggle() {
         $bActive.value = !$bActive.value
      }
   })


   const $cActive = Ion(false, {
      toggle() {
         $cActive.value = !$cActive.value
      }
   })


   const $dActive = Ion(false, {
      toggle() {
         $dActive.value = !$dActive.value
      }
   })



   return component(
      <article>
         <div>{$count}</div>
         <div>{($count() + 1)}</div>
         <div>{$doubleCount}</div>
         <button on:click={e => $count.increment()}>+</button>
         <button on:click={e => $count.decrement()}>-</button>

         {If(($doubleCount() > 3), 'create',
            <p>(0) doublecount is greater than 3!</p>
         )}


         {If(($doubleCount() > 0), 'create',
            <p>(1) doublecount is greater than 0!</p>
         )}
         {If(($count() > 3), 'create',
            <p>(2) count is greater than 3!</p>
         )}
         {If(($count() > 0), 'create',
            <p>(3) count is greater than 0!</p>
         )}
         {/*          

         {If($active,
            <p>doublecount is greater than 3!</p>
         )}
         {If(($doubleCount() > 3),
            <p>doublecount is greater than 3!</p>
         )}
         {If(($doubleCount() > 0), 'mount',
            <p>doublecount is greater than 0!</p>
         )}
         {If(($count() > 3), 'mount',
            <p>count is greater than 3!</p>
         )}
         {If(($count() > 0), 'show',
            <p>count is greater than 0!</p>
         )}

         {If(($doubleCount() > 3), 'create',
            <p>doublecount is greater than 3!</p>
         )}
         {If(($doubleCount() > 0), 'mount',
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
         )} */}

         {/* <div>{$count}</div> */}
         {/* <div>{$doubleCount}</div> */}
         {/* <button on:click={e => $aActive.toggle()}>toggle A (mount)</button> */}
         {/* <button on:click={$bActive.toggle}>toggle B (create)</button> */}
         {/* <button on:click={$cActive.toggle}>toggle C (mount)</button>
         <button on:click={$dActive.toggle}>toggle D (show)</button> */}
         {/* <button on:click={$count.decrement}>-</button> */}
         {/* {If($aActive, 'create',
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
         )} */}
         {/* {If($cActive, 'mount',
            <p>C ACTIVE</p>
         )}
         {If($dActive, 'show',
            <p>D ACTIVE</p>
         )} */}



      </article>
   )
}