// @ts-nocheck
import { component, SuspenseIon } from "@rue/lumo";
import { Ion } from "@rue/quarky";
import { Await } from "../../../../packages/lumo/src/boundaries/Await";

const RemoteIon = SuspenseIon


export function TestAsyncMultiply() {

   const $n = Ion(1, {
      increment() {
         this.value++
      }
   })

   const [$suspense, $resolution] = Suspense()

   function $Multiply($a: Ion<number>, b: number) {

      const $axb = RemoteIon('...' as '...' | number, async () => {
         const a = $a()
         return new Promise<number>((resolve, reject) => {
            setTimeout(() => {
               resolve(a * b);
            }, Math.random() * 2000);
         });
      }, { suspend: $suspense })

      return () => ($suspense() ? '...' : $axb())
   }

   return component(
      <div>
         <button on:click={$n.increment}>+</button>
         {Suspense(<>
            <p>1 * {$n} = {$Multiply($n, 1)}</p>
            <p>2 * {$n} = {$Multiply($n, 2)}</p>
            <p>3 * {$n} = {$Multiply($n, 3)}</p>
         </>)}
      </div>
   )
}

function dispatchMultiply() {

}

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