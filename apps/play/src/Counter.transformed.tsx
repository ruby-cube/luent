import { Ion, MutableIon , πø, destructureØ, absorbØ, ø} from "@rue/quarky";
import { FromTag, If, template } from "@rue/lumo";

function FractionKit(øcount: Ion<number>) {
   
   return absorbØ({
øhalfCount: Ion(() => øcount() / 2),
øthirdCount: Ion(() => øcount() / 3)
}, ['øhalfCount', 'øthirdCount'])
}

function FractionKitB(øcount: Ion<number>) {
   const øhalfCount = Ion(() => øcount() / 2)
   const øthirdCount = Ion(() => øcount() / 3)
   
   return {
      get halfCount() { return øhalfCount() },
      get thirdCount() { return øthirdCount() } 
   }
}


function FractionKitC(øcount: Ion<number>) {
   
   return {
      øhalfCount: Ion(() => øcount() / 2),
      øthirdCount: Ion(() => øcount() / 3)
   }
}

export function QrxCounter({ øshowFractions }: FromTag<{ showFractions: MutableIon<boolean> }>) {

   const øcount = Ion(0, {
      increment() {
         øcount.value++
      }
   })
   const ødoubleCount = Ion(() => øcount() * 2)
const { øhalfCountA, øthirdCountA } = destructureØ(FractionKit(øcount), 'øhalfCountA', 'øthirdCountA');

   const kit = FractionKit(øcount);
   const øhalfCount = πø(kit, 'halfCount')
   const øthirdCount = πø(kit, 'thirdCount')

   function doSomething(count: number) {
      console.log('count', count)
   }

   doSomething(øcount())

   function other(count: number) {
      console.log('counter',
         //@ts-expect-error
         cout
      )
   }

   return template(
      <div>
         <button on:click={e => øcount.increment()}>+</button>
         <p>start: {øcount()}</p>
         <p>count: {øcount}</p>
         <p>doubleCount: {ødoubleCount}</p>
         <p>tripleCount: {ø(() => øcount() * 3)}</p>
         <button on:click={e => øshowFractions.value = !øshowFractions()}>{ø(() => øshowFractions() ? 'hide' : 'show')} fractions</button>
         {If(øshowFractions, <>
            <hr></hr>
            <p>halfCount: {øhalfCount}</p>
            <p>thirdCount: {øthirdCount}</p>
         </>)}
      </div>
   )
}

