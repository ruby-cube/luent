import { template, For, FromTag } from "@rue/lumo";
import { $_derivation, Action, instantUpdate, Ion, Ionic, isPending, MutableIon, queueIonicTask, SuspenseIon, swiftUpdate } from "@rue/quarky";
import { o, ooo } from "../../../../packages/quarky/src/async/ooo";
import { Await, Meanwhile } from "../../../../packages/lumo/src/boundaries/Await";
import { Dispatch } from "../../../../packages/quarky/src/async/Dispatch";


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

   return template(
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

   const $pending = SuspenseIon('...')
   const multipliers: any[] = []
   const products: any[] = []

   for (let i = 1; i < 5; i++) {
      const $product = Ion($n() * i)

      const multiply = Dispatch(() => db.multiply($n(), i), {
         // '-presume': () => $product.value = $n() * i,
         '-then': [[$product, (res) => $product.value = res]], // TODO: .value and setting pions should cancel pending dispatches
         '-suspend': $pending
      })

      multipliers.push(multiply)
      products.push(Ion(() => $pending() ? '...' : $product()))
   }

   function multiply() {
      for (const multiplier of multipliers) {
         multiplier()
      }
   }

   return template(
      <div>
         <button on:click={e => { $n.increment(); multiply() }}>{$n} {($pending() ? '...' : '')}</button>
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

//    return template(
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

   return template(
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

   return template(
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

   return template(
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

   return template(
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


function MultiplyKitA() {
   return {
      $Multiply($n: Ion<number>, o: number) {
         return Ion(0, {
            '-fetch': () => db.multiply($n(), o)
         })
      }
   }
}

function MultiplyKit() {
   const $pending = SuspenseIon('...')
   return {
      $Multiply($n: Ion<number>, o: number) {
         return Ion(0, {
            '-fetch': () => db.multiply($n(), o),
            '-suspend': $pending
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
