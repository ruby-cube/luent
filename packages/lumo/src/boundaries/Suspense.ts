import { toError } from "@rue/utils";
import { ion, __addDevName, ionicTask, Ion, MutableIon, isIon } from "../../../quarky/src";
import { pend, pendReload } from "./Await";
import { SYNC } from "../render-cycle";



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
   error: null | Error,
   promise: Promise<T> | null,
   pending: boolean
   // cancel(): void
   // onCancel(task: () => void): void
}
export type SuspenseIon<T> = MutableIon<T | undefined> & Suspense<T>
export type Awaited<T> = MutableIon<T | undefined> & Suspense<T>
export type Resolved<T> = MutableIon<T> & {
   [SUSPENSE_ION]: true,
   promise: null,
   error: null, // different
   pending: false,
   // cancel(): void
   // onCancel(task: () => void): void
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

type SuspenseIonOptions = {
   awaited: true | 'load'
}

export function SuspenseIon<
   T,
   B extends boolean,
   OPT = undefined
>(initialState: T | undefined, input: Promise<T> | ((ion: SuspenseIon<T>) => Promise<T>), options?: OPT & SuspenseIonOptions): OPT extends undefined ? SuspenseIon<T> : B extends true | 'load' | 'reload' ? Awaited<T> : SuspenseIon<T> {
   if (input instanceof Promise) {
      if (options?.awaited) {
         pend(input)
      }
      const $ion = ion(initialState as T | undefined, {
         [SUSPENSE_ION]: true,
         promise: input,
         error: null,
         pending: true
      }) as SuspenseIon<T>

      input
         .then(value => {
            $ion.state = value;
            $ion.promise = null;
            $ion.pending = false;
         })
         .catch(err => {
            $ion.error = toError(err)
            $ion.promise = null;
            $ion.pending = false;
         })

      return $ion;
   }

   const $promise = ion(null as null | Promise<T>)
   const $ion = ion(initialState as unknown, {
      [SUSPENSE_ION]: true,
      get promise() {
         return $promise()
      },
      get pending(){
         return !!$promise()
      },
      error: null as null | Error,
   })

   ionicTask(() => {
      const promise = $promise.state = input($ion as SuspenseIon<T>);

      promise
         .then(value => {
            $ion.state = value
            $promise.state = null;
         })
         .catch(err => {
            $ion.error = toError(err)
            $promise.state = null;
            throw err;
         })
   }, { phase: SYNC })

   if (options?.awaited) {
      const promise = $promise()
      if (promise) pend(promise)
      if (options?.awaited === true) {
         pendReload($promise)
      }
   }
   return $ion as SuspenseIon<T>;
}

export function asSuspenseIon<T>(value: SuspenseIon<T> | Promise<T>, options: { awaited: true }): SuspenseIon<T> {
   if (isSuspenseIon(value)) return value;
   return SuspenseIon(undefined, value)
}

function isSuspenseIon(value: unknown): value is SuspenseIon<unknown> {
   return isIon(value) && SUSPENSE_ION in value;
}

