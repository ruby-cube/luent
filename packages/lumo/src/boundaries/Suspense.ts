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
// Should { awaited: true } be the default? or { renderUndefined: true } or { dontAwait } or 

export type Suspense<T> = { promise: Promise<T>, error: null | Error, awaited: () => Awaited<T> }
export type SuspenseIon<T> = MutableIon<T | undefined> & Suspense<T>
export type Awaited<T> = MutableIon<T | undefined> & Suspense<T>
export type Resolved<T> = MutableIon<T> & { promise: Promise<T>, error: null, awaited: () => Awaited<T> }


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

function createSuspenseIon<T, B extends boolean, OPT = undefined>(input: Promise<T> | ((ion: SuspenseIon<T>) => Promise<T>), options?: OPT & { awaited: B }): OPT extends undefined ? SuspenseIon<T> : B extends true ? Awaited<T> : SuspenseIon<T> {
   if (input instanceof Promise) {
      // if (options?.awaited) pend(input)
      const $ion = ion(undefined as T | undefined) as SuspenseIon<T>
      $ion.promise = input
      $ion.error = null;
      $ion.awaited = () => {
         //TODO: trace must await calls for debugging
         pend(input);
         return $ion
      }

      input
         .then(value => $ion.state = value)
         .catch(err => {
            $ion.error = toError(err)
         })

      return $ion;
   }

   const $ion = ion(undefined) as SuspenseIon<T>
   $ion.awaited = () => {
      //TODO: trace must await calls for debugging
      pend($ion.promise);
      return $ion
   }
   ionicTask(() => {
      const promise = input($ion);
      $ion.promise = promise;

      promise
         .then(value => $ion.state = value)
         .catch(err => {
            $ion.error = toError(err)
            throw err;
         })
   })
   return $ion as SuspenseIon<T>;
}

export function asSuspenseIon<T>(value: SuspenseIon<T> | Promise<T>): SuspenseIon<T> {
   if ('suspense' in value) return value;
   return createSuspenseIon(value)
}


