//@ts-nocheck
import { component, AsyncIon, Suspense, For } from "@rue/lumo";
import { $_derivation, instantUpdate, Ion, MutableIon, queueIonicTask, swiftUpdate } from "@rue/quarky";
import { AsyncAction } from "../../../../packages/lumo/src/boundaries/AsyncAction";
import { Await } from "../../../../packages/lumo/src/boundaries/Await";


export function TestAsyncMultiply() {

   const $n = Ion(1, {
      increment() {
         this.value++
      }
   })

   function MultiplyKit($n: Ion<number>, b: number) {
      const $product = Ion($n() * b)
      const $nxb = $_derivation(() => (multiply.pending ? '...' : $product()))
      const multiply = AsyncAction(async () => {
         const res = await db.multiply($n(), b)
         swiftUpdate(() => { // TODO: auto swiftupdate?
            $product.value = res
         })
      })
      return { multiply, $product: $nxb }
   }

   const { multiply: nx2, $product } = MultiplyKit($n, 2)


   return component(
      <div>
         <button on:click={e => {
            $n.increment();
            nx2()
         }}>{$n} {(nx2.pending ? '...' : '')}</button>
         <p>2 * {$n} = {$product}</p>

      </div>
   )
}



export function TestAsyncMultipliers() {

   const $n = Ion(1, {
      increment() {
         this.value++
      }
   })

   const Async = AsyncAction

   function MultiplyKit($n: Ion<number>, b: number, $suspense: Suspense) {
      const $product = Ion($n() * b)
      const $nxb = $_derivation(() => ($suspense() ? '...' : $product()))

      // const multiply = AsyncAction(async () => {
      //    const res = await db.multiply($n(), b)
      //    $product.value = res
      // }, { suspense: $suspense })


      // const multiply = AsyncAction(() => {
      //    oo.await(() => db.multiply($n(), b),
      //       res => { $product.value = res }
      //    )
      // }, { suspense: $suspense })

      const multiply = AsyncAction(
         () => db.multiply($n(), b),
         res => { $product.value = res }, {
         suspense: $suspense
      })

      // const multiply = AsyncAction({
      //    dispatch: () => db.multiply($n(), b),
      //    settled: res => $product.value = res,
      //    suspense: $suspense
      // })

      return { multiply, $product: $nxb }
   }

   function MultipliersKit() {
      const $suspense = Suspense()
      const multipliers: any[] = []
      const products: any[] = []
      for (let i = 1; i < 5; i++) {
         const { multiply, $product } = MultiplyKit($n, i, $suspense)
         multipliers.push(multiply)
         products.push($product)
      }

      function multiply() {
         for (const multiplier of multipliers) {
            multiplier()
         }
      }

      return [multiply, products, $suspense] as const
   }

   const [multiply, products, $pending] = MultipliersKit()


   return component(
      <div>
         <button on:click={e => {
            $n.increment();
            multiply()
         }}>{$n} {($pending() ? '...' : '')}</button>
         {For(products, ($product, i) =>
            <p>{i + 1} * {$n} = {$product}</p>
         )}
      </div>
   )
}

// export function TestAsyncMultiplyA() {

//    const $n = Ion(1, {
//       increment() { this.value++ }
//    })

//    const $nx1 = AsyncIon(async () => await multiply($n(), 1))
//    const $nx2 = AsyncIon(async () => await multiply($n(), 2))
//    const $nx3 = AsyncIon(async () => await multiply($n(), 3))

//    return component(
//       <div>
//          <button on:click={$n.increment}>+</button>
//          {Await(
//             <>
//                <p>1 * {$n} = {($suspense() ? '...' : $nx1())}</p>
//                <p>2 * {$n} = {($suspense() ? '...' : $nx2())}</p>
//                <p>3 * {$n} = {($suspense() ? '...' : $nx3())}</p>
//             </>
//          )}
//       </div>
//    )
// }

const oo = { await(a: any) { } }


export function TestAsyncMultiplyB() {

   const $n = Ion(1, {
      increment() { console.log('))) increment'); this.value++ }
   })

   const { $Multiply, $pending } = MultiplyKit()
   // const $product = AsyncIon(() => {
   //    return multiply($n(), 2)
   // })

   return component(
      <div>
         {/* <button on:click={e => $n.increment()}>{$n} {($product.pending ? '...' : '')}</button> */}
         <button on:click={e => $n.increment()}>{$n} {($pending() ? '...' : '')}</button>
         <p>1 * {$n} = {$Multiply($n, 1)}</p>
         <p>2 * {$n} = {$Multiply($n, 2)}</p>
         <p>3 * {$n} = {$Multiply($n, 3)}</p>
         <p>4 * {$n} = {$Multiply($n, 4)}</p>
      </div>
   )
}





function MultiplyKit() {
   const $pending = Suspense('...')
   return {
      $Multiply($n: Ion<number>, o: number) {
         return AsyncIon(() => db.multiply($n(), o), { suspense: $pending })
      },
      $pending
   }
}

const db = {
   multiply(a: number, b: number) {
      return new Promise<number>((resolve) => {
         setTimeout(() => {
            resolve(a * b);
         }, Math.random() * 2000);
      })
   }
}

const multiply = db.multiply

// ))) updateIonWithInput
// ))) new output Promise {<pending>}
// ))) ** new promise

// ))) updateIonWithInput
// ))) new output Promise {<pending>}

// ))) reject
// ))) cancelled Promise {<rejected>: 'cancelled'}
// ))) resolved () => $activeState() ? fetchCities2($activeState()) : []
