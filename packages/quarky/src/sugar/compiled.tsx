import { FromTag, If, template } from "@rue/lumo"
import { Ion } from "../ion/Ion"

// transpiled
function Counter({ $showFractions }: FromTag<{ showFractions: Ion<boolean> }>) {

   const $count = Ion(0, {
      increment() {
         $count.value++
      }
   })
   const $doubleCount = Ion(() => $count() * 2)

   const { $halfCount, $thirdCount } = FractionKit($count)

   return template(
      <div>
         <button on:click={e => $count.increment()}>+</button>
         <p>start: {$count()}</p>
         <p>count: {$count}</p>
         <p>doubleCount: {$doubleCount}</p>
         <p>tripleCount: {($count() * 3)}</p>
         {If($showFractions, 
            <>
               <hr></hr>
               <p>halfCount: {$halfCount}</p>
               <p>thirdCount: {$thirdCount}</p>
            </>
         )}
      </div>
   )
}

function FractionKit($count: Ion<number>) {
   return {
      $halfCount: Ion(() => $count() / 2),
      $thirdCount: Ion(() => $count() / 3)
   }
}