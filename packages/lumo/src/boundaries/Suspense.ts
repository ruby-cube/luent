import { toError } from "@rue/utils";
import { ion, __addDevName, ionicTask, Ion, MutableIon, isIon } from "../../../quarky/src";
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

const SUSPENSE_ION = Symbol('suspense ion')


//TODO:
export type Suspense<T> = {
   [SUSPENSE_ION]: true,
   cancel(): void
   onCancel(task: () => void): void
   promise: Promise<T>,
   error: null | Error,
   updating: boolean,
   settled: boolean
}
export type SuspenseIon<T> = MutableIon<T | undefined> & Suspense<T>
export type Awaited<T> = MutableIon<T | undefined> & Suspense<T>
export type Resolved<T> = MutableIon<T> & {
   [SUSPENSE_ION]: true,
   promise: Promise<T>,
   error: null, // different
   updating: boolean,
   cancel(): void
   onCancel(task: () => void): void
   settled: boolean
}


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

export function SuspenseIon<
   T,
   B extends boolean,
   OPT = undefined
>(initialState: T | undefined, input: Promise<T> | ((ion: SuspenseIon<T>) => Promise<T>), options?: OPT & { awaited: B }): OPT extends undefined ? SuspenseIon<T> : B extends true ? Awaited<T> : SuspenseIon<T> {
   if (input instanceof Promise) {
      if (options?.awaited) pend(input)
      const $ion = ion(initialState as T | undefined) as SuspenseIon<T>
      $ion.promise = input
      $ion.error = null;
      // $ion.awaited = () => {
      //    //TODO: trace must await calls for debugging
      //    pend(input);
      //    return $ion
      // }

      input
         .then(value => $ion.state = value)
         .catch(err => {
            $ion.error = toError(err)
         })

      return $ion;
   }

   const $ion = ion(initialState) as SuspenseIon<T>
   // $ion.awaited = () => {
   //    //TODO: trace must await calls for debugging
   //    pend($ion.promise);
   //    return $ion
   // }
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
   if (options?.awaited) pend($ion.promise)
   return $ion as SuspenseIon<T>;
}

export function asSuspenseIon<T>(value: SuspenseIon<T> | Promise<T>, options: { awaited: true }): SuspenseIon<T> {
   if (isSuspenseIon(value)) return value;
   return SuspenseIon(undefined, value)
}

function isSuspenseIon(value: unknown): value is SuspenseIon<unknown> {
   return isIon(value) && SUSPENSE_ION in value;
}

