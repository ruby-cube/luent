import { ion, __addDevName, ionicTask, Ion, MutableIon } from "../../../quarky/src";
import { Else, ElseIf, If } from "../conditional/If";
import { JSXNode } from "../node/makeNode";
import { defineGlobal } from "../commons/centralized";
import { pend } from "./Await";



export type SuspenseNodeInput = {
   timeout?: number,
   await?: Promise<any> | Promise<any>[],
   standin?: () => JSXNode
   catch?: (error: Error) => JSXNode
}


//TODO: Suspense Ion must have value (T | undefined)
// QUESTION: should suspense boundaries be the default? No because you might not want to hold up rendering for something that is ok to be undefined
// Should { mustAwait: true } be the default? or { renderUndefined: true } or { dontAwait } or 

type Suspense<T> = MutableIon<T | undefined> & { abort?: () => void, retry?: () => void, promise: Promise<T>, error: Error | null }
type Awaited<T> = MutableIon<T | undefined> & { abort?: () => void, retry?: () => void, promise: Promise<T>, error: Error | null }


export function assertResolved<T>(suspense: Suspense<T>): asserts suspense is MutableIon<T> {
   if (suspense instanceof Promise)
      throw Error('suspense not resolved yet')
   if (suspense instanceof Error)
      throw Error('suspense has errored')
   return;
}

export function isResolved<T>(suspense: Suspense<T>): suspense is MutableIon<T> {
   return !(suspense.state instanceof Promise || suspense.state instanceof Error)
}

export function isPending(ion: Suspense<unknown>) {
   return ion.state instanceof Promise;
}

export function createSuspenseIon<T, B extends boolean, OPT = undefined>(input: Promise<T> | ((suspense: Suspense<T>) => Promise<T>), options?: OPT & { mustAwait: B }): OPT extends undefined ? Suspense<T> : B extends true ? Awaited<T> : Suspense<T> {
   if (input instanceof Promise) {
      if (options?.mustAwait) pend(input)
      const $ion = ion(input as Promise<T> | T | Error) as MutableIon<Promise<T> | T | Error>

      input
         .then(value => $ion.state = value)
         .catch(err => {
            $ion.state = new Error(err) //FIX:
         })

      return $ion;
   }
   const $ion = ion(undefined) as MutableIon<Promise<T> | T | Error>

   let initial = true;
   ionicTask(() => {
      const promise = $ion.state = input($ion);
      if (initial && options?.mustAwait)
         (initial = false, pend(promise))

      promise
         .then(value => $ion.state = value)
         .catch(err => {
            $ion.state = new Error(err) //FIX:
            throw err;
         })
   })
   return $ion;
}

