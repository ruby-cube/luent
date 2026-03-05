import { FromTag, If, template } from "@rue/lumo"
import { Ion, ø } from "@rue/quarky"

// transpiled
function Counter({ øshowFractions }: FromTag<{ showFractions: Ion<boolean> }>) {

   const øcount = Ion(0, {
      increment() {
         øcount.value++
      }
   })
   const ødoubleCount = Ion(() => øcount() * 2)

   const { øhalfCount, øthirdCount } = FractionKit(øcount)

   return template(
      <div>
         <button on:click={e => øcount.increment()}>+</button>
         <p>start: {øcount()}</p>
         <p>count: {øcount}</p>
         <p>doubleCount: {ødoubleCount}</p>
         <p>tripleCount: {ø(() => øcount() * 3)}</p>
         {If(øshowFractions, 
            <>
               <hr></hr>
               <p>halfCount: {øhalfCount}</p>
               <p>thirdCount: {øthirdCount}</p>
            </>
         )}
      </div>
   )
}

function FractionKit(øcount: Ion<number>) {
   const øhalfCount = Ion(() => øcount() / 2)
   const øthirdCount = Ion(() => øcount() / 3)

   return {
      get halfCount() { return øhalfCount() },
      get thirdCount() { return øthirdCount() },
   }
}