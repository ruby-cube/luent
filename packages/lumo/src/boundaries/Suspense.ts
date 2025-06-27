import { toError } from "@rue/utils";
import { ion, __addDevName, ionicTask, Ion, MutableIon } from "../../../quarky/src";
import { pend } from "./Await";



// export type SuspenseNodeInput = {
//    timeout?: number,
//    await?: Promise<any> | Promise<any>[],
//    standin?: () => JSXNode
//    catch?: (error: Error) => JSXNode
// }


//TODO: Suspense Ion must have value (T | undefined)
// QUESTION: should suspense boundaries be the default? No because you might not want to hold up rendering for something that is ok to be undefined
// Should { mustAwait: true } be the default? or { renderUndefined: true } or { dontAwait } or 

export type SuspenseIon<T> = MutableIon<T | undefined> & { suspense: Promise<T>, error: null | Error }
export type Awaited<T> = MutableIon<T | undefined> & { suspense: Promise<T>, error: null | Error }
export type Resolved<T> = MutableIon<T> & { suspense: Promise<T>, error: null }


export function assertResolved<T>(ion: SuspenseIon<T>): asserts ion is Resolved<T> {
   if (ion instanceof Promise)
      throw Error('suspense not resolved yet')
   if (ion instanceof Error)
      throw Error('suspense has errored')
   return;
}

export function isResolved<T>(ion: SuspenseIon<T>): ion is Resolved<T> {
   return !(ion.state instanceof Promise || ion.state instanceof Error)
}

export function isPending(ion: SuspenseIon<unknown>) {
   return ion.state instanceof Promise;
}

export function createSuspenseIon<T, B extends boolean, OPT = undefined>(input: Promise<T> | ((ion: SuspenseIon<T>) => Promise<T>), options?: OPT & { mustAwait: B }): OPT extends undefined ? SuspenseIon<T> : B extends true ? Awaited<T> : SuspenseIon<T> {
   if (input instanceof Promise) {
      if (options?.mustAwait) pend(input)
      const $ion = ion(undefined as T | undefined) as SuspenseIon<T>
      $ion.suspense = input
      $ion.error = null;

      input
         .then(value => $ion.state = value)
         .catch(err => {
            $ion.error = toError(err)
         })

      return $ion;
   }
   const $ion = ion(undefined) as SuspenseIon<T>

   let initial = true;
   ionicTask(() => {
      const promise = input($ion);
      if (initial && options?.mustAwait)
         (initial = false, pend(promise))

      promise
         .then(value => $ion.state = value)
         .catch(err => {
            $ion.error = toError(err)
            throw err;
         })
   })
   return $ion as SuspenseIon<T>;
}


