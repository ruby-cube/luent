import { component, AsyncIon, Suspense } from "@rue/lumo";
import { $_derivation, instantUpdate, Ion, queueIonicTask } from "@rue/quarky";


// export function TestAsyncMultiply() {

//    const $n = Ion(1, {
//       increment() {
//          this.value++
//       }
//    })

//    const multiply = AsyncAction((a: number, b: number) => db.multiply(a, b))

//    function $Product($a: Ion<number>, b: number) {
//       const $product = AsyncIon(() => multiply($a(), b))
//       return () => (multiply.pending ? '...' : $product())
//    }

//    return component(
//       <div>
//          <button on:click={$n.increment}>+</button>
//          <p>1 * {$n} = {$Product($n, 1)}</p>
//          <p>2 * {$n} = {$Product($n, 2)}</p>
//          <p>3 * {$n} = {$Product($n, 3)}</p>
//       </div>
//    )
// }

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

   // const { $Multiply, $pending } = MultiplyKit()
   const $product = AsyncIon(() => {
      return multiply($n(), 2)
   })

   function multiply(n: number, o: number): Promise<number> | void {
      if ($product.fetching) {
         $product.cancelFetch()
      }
      return db.multiply(n, o)
   }
   return component(
      <div>
         <button on:click={e => $n.increment()}>{$n} {($product.pending ? '...' : '')}</button>
         <p>2 * {$n} = {($product.pending ? '...' : $product())}</p>
         {/* <p>1 * {$n} = {$Multiply($n, 1)}</p>
         <p>2 * {$n} = {$Multiply($n, 2)}</p>
         <p>3 * {$n} = {$Multiply($n, 3)}</p>
         <p>4 * {$n} = {$Multiply($n, 4)}</p>
         <p>5 * {$n} = {$Multiply($n, 5)}</p> */}
      </div>
   )
}

function MultiplyKit() {
   const $pending = Suspense()
   return {
      $Multiply($n: Ion<number>, o: number) {
         const $nxo = AsyncIon(() => {
            return multiply($n(), o)
         }, { suspense: $pending })

         function multiply(n: number, o: number): Promise<number> | void {
            if ($nxo.fetching) {
               $nxo.cancelFetch()
            }
            return db.multiply(n, o)
         }

         return Ion(() => $pending() ? '...' : $nxo())
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
