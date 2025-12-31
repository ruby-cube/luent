// @ts-nocheck
import { component, SuspenseIon } from "@rue/lumo";
import { $_derivation, Ion, queueIonicTask } from "@rue/quarky";
import { Await } from "../../../../packages/lumo/src/boundaries/Await";

const AsyncIon = SuspenseIon

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

export function TestAsyncMultiplyA() {

   const $n = Ion(1, {
      increment() { this.value++ }
   })

   const $nx1 = AsyncIon(async () => await multiply($n(), 1))
   const $nx2 = AsyncIon(async () => await multiply($n(), 2))
   const $nx3 = AsyncIon(async () => await multiply($n(), 3))

   return component(
      <div>
         <button on:click={$n.increment}>+</button>
         {Await(
            <>
               <p>1 * {$n} = {($suspense() ? '...' : $nx1())}</p>
               <p>2 * {$n} = {($suspense() ? '...' : $nx2())}</p>
               <p>3 * {$n} = {($suspense() ? '...' : $nx3())}</p>
            </>
         )}
      </div>
   )
}


export function TestAsyncMultiplyB() {

   const $n = Ion(1, {
      increment() { this.value++ }
   })

   const $pending = Suspense()

   function $Multiply($a: Ion<number>, b: number) {
      const $axb = AsyncIon(0, () => db.multiply($a(), b), { suspense: $pending }) // TODO: hold in the past till suspense is resolved?
      return $_derivation(() => ($pending() ? '...' : $axb()))
   }

   return component(
      <div>
         <button on:click={$n.increment}>+</button>
         <p>1 * {$n} = {$Multiply($n, 1)}</p>
         <p>2 * {$n} = {$Multiply($n, 2)}</p>
         <p>3 * {$n} = {$Multiply($n, 3)}</p>
      </div>
   )
}

const db = {
   multiply(a: number, b: number) {
      new Promise<number>((resolve, reject) => {
         setTimeout(() => {
            resolve(a * b);
         }, Math.random() * 2000);
      })
   }
}

const multiply = db.multiply


function Suspense() {
   const promises: Promise<any>[] = []
   const $suspense = Ion(true, {
      initial: true,
      suspend(promise: Promise<any>) {
         promises.push(promise)
      }
   })

   let resolve;
   let reject;
   const resolution = new Promise((res, rej) => {
      resolve = res
      reject = rej
   })

   resolution.then(() => {

   })

   const $resolution = Ion(resolution, {
      initial: true
   })
   return [$suspense, $resolution]
}