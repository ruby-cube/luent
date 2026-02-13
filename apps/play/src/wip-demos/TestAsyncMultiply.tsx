import { component, For, FromTag } from "@rue/lumo";
import { $_derivation, Action, instantUpdate, Ion, Ionic, MutableIon, queueIonicTask, SuspenseIon, swiftUpdate } from "@rue/quarky";
import { ooo } from "../../../../packages/quarky/src/async/ooo";
import { Await, Meanwhile } from "../../../../packages/lumo/src/boundaries/Await";


export function TestAsyncMultiply() {

   const $n = Ion(1, {
      increment() {
         this.value++
      }
   })

   // function MultiplyKit($n: Ion<number>, b: number) {
   //    const $product = Ion($n() * b)
   //    const $nxb = $_derivation(() => (multiply.pending ? '...' : $product()))
   //    const multiply = Action(async () => {
   //       const res = await db.multiply($n(), b)
   //       swiftUpdate(() => { // TODO: auto swiftupdate?
   //          $product.value = res
   //       })
   //    })
   //    return { multiply, $product: $nxb }
   // }

   // const { multiply: nx2, $product } = MultiplyKit($n, 2)

   const $nx2 = Ion(0, {
      '-fetch': () => db.multiply($n(), 2)
   })

   return component(
      <div>
         <button on:click={e => {
            $n.increment();
         }}>{$n} {($nx2.pending ? '...' : '')}</button>
         <p>2 * {$n} = {($nx2.pending ? '...' : $nx2())}</p>

      </div>
   )
}




function Async(fn: (...args: any[]) => Promise<unknown> | unknown) {

}



export function TestAsyncMultipliers() {

   const $n = Ion(1, {
      increment() {
         this.value++
      }
   })

   function MultiplyKit($n: Ion<number>, b: number, $suspense: SuspenseIon) {
      const $product = Ion($n() * b)

      const multiply = Action(() => (ooo
         .await(db.multiply($n(), b))
      ), {
         target: $product,
         '-suspense': $suspense
      })

      // const multiplyB = Action(() => db.multiply($n(), b), {
      //    mutable: $product,
      //    suspense: $suspense
      // })

      return {
         multiply,
         $product: $_derivation(() => ($suspense() ? '...' : $product()))
      }
   }

   function MultipliersKit() {
      const $suspense = SuspenseIon('...')
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


export function TestAsyncMultiplyDrop() {

   const $n = Ion(1, {
      increment() { this.value++ }
   })

   const { $Multiply, $pending } = MultiplyKit()

   return component(
      <div>
         <button disabled={$pending} on:click={e => $n.increment()}>{$n} {($pending() ? '...' : '')}</button>
         <p>1 * {$n} = {$Multiply($n, 1)}</p>
         <p>2 * {$n} = {$Multiply($n, 2)}</p>
         <p>3 * {$n} = {$Multiply($n, 3)}</p>
         <p>4 * {$n} = {$Multiply($n, 4)}</p>
      </div>
   )
}

const AwaitedIon = (a: any) => Ion(undefined, {
   '-fetch': a,
   '-awaited': true
})
const $Awaited = AwaitedIon

export function TestAsyncMultiplyQueue() {

   const $n = Ion((1 as null | number), {
      increment() { this.value++ }
   })

   const nums = Ionic([1])

   return component(
      <div>
         <button on:click={e => { $n.increment(); nums.push($n()) }}>{$n}</button>
         {For(nums, (num) => (
            <Result n={num}></Result>
         ))}
      </div>
   )
}

function Result(input: FromTag<{ n: number }>) {
   const { n } = input

   function $Multiply(n: number, o: number) {
      return AwaitedIon(() => db.multiply(n, o))
   }

   return component(
      <div style="border: 1px solid gray; padding: 5px">
         {Await(<>
            <p>1 * {n} = {$Multiply(n, 1)}</p>
            <p>2 * {n} = {$Multiply(n, 2)}</p>
            <p>3 * {n} = {$Multiply(n, 3)}</p>
            <p>4 * {n} = {$Multiply(n, 4)}</p>

            <p>1 * {n} = {$Awaited(() => db.multiply(n, 1))}</p>
            <p>2 * {n} = {$Awaited(() => db.multiply(n, 2))}</p>
            <p>3 * {n} = {$Awaited(() => db.multiply(n, 3))}</p>
            <p>4 * {n} = {$Awaited(() => db.multiply(n, 4))}</p>

            {/* <p>1 * {n} = {$Awaited((db.multiply(n, 1)))}</p>
            <p>2 * {n} = {$Awaited((db.multiply(n, 2)))}</p>
            <p>3 * {n} = {$Awaited((db.multiply(n, 3)))}</p>
            <p>4 * {n} = {$Awaited((db.multiply(n, 4)))}</p> */}
         </>)}
         {Meanwhile('...')}
      </div>
   )
}


function MultiplyKit() {
   const $pending = SuspenseIon('...')
   return {
      $Multiply($n: Ion<number>, o: number) {
         return Ion(0, {
            '-fetch': () => db.multiply($n(), o),
            '-suspense': $pending
         })
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
