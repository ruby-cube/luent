import { Ion, MutableIon , πø, destructureØ, ø} from "@rue/quarky";
import { FromTag, If, template } from "@rue/lumo";

// function FractionKit(øcount: Ion<number>) {

//       return {
//          get halfCount: Ion(() => count / 2),
//          get thirdCount: Ion(() => count / 3)
//       }
// }

function FractionKitB(øcount: Ion<number>) {
   const øhalfCount = Ion(() => øcount() / 2)
   const øthirdCount = Ion(() => øcount() / 3)

   return {
      get halfCount() { return øhalfCount() },
      get thirdCount() { return øthirdCount() }
   }
}


function FractionKit(øcount: Ion<number>) {

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
   const øhalfCount = (kit.øhalfCount, πø(kit, 'halfCount'))
   const øthirdCount = (kit.øthirdCount, πø(kit, 'thirdCount'))

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

   let dog;

   const øobj = Ion({ name: 'kermit' } as { name: string } | undefined)

   function doSomethingElse() {
      if (dog) {

      }
      else if (øobj()) {
         const name = øobj()?.name
         console.log('name', øobj()!, name)
      }
      else {
         øobj()?.name
         console.log('nothing')
      }
   }

   doSomethingElse()

   return template(
      <div>
         <button on:click={e => øcount.increment()}>+</button>
         <p>start: {øcount()}</p>
         <p>count: {øcount}</p>
         <p>doubleCount: {ødoubleCount}</p>
         <p>tripleCount: {ø(() => øcount() * 3)}</p>
         <button on:click={e => { øshowFractions.value = !øshowFractions(); øshowFractions() ? øobj.value = undefined : øobj.value = { name: 'sir robin' } }}>{ø(() => øshowFractions() ? 'hide' : 'show')} fractions</button>
         {If(øobj(),
            <div>{øobj()?.name}</div>
         )}
         {If(øobj(),
            <div>{ø(() => øobj()?.name)}</div>
         )}
         {If(øobj(), () =>
            <div>{øobj()?.name}</div>
         )}
         {If(øobj,
            <div>{øobj()?.name}</div>
         )}
         {If(øobj,
            <div>{ø(() => øobj()?.name)}</div>
         )}
         {If(øobj, () =>
            <div>{øobj()?.name}</div>
         )}
         {If(øshowFractions, <>
            <hr></hr>
            <p> halfCount: {øhalfCount}</p>
            <p> thirdCount: {øthirdCount}</p>
         </>)}
      </div >
   )
}

