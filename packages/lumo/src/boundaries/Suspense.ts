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
   error: null | Error,
   promise: Promise<T>,
   // cancel(): void
   // onCancel(task: () => void): void
   // updating: boolean,
   // settled: boolean
}
export type SuspenseIon<T> = MutableIon<T | undefined> & Suspense<T>
export type Awaited<T> = MutableIon<T | undefined> & Suspense<T>
export type Resolved<T> = MutableIon<T> & {
   [SUSPENSE_ION]: true,
   promise: Promise<T>,
   error: null, // different
   // updating: boolean,
   // cancel(): void
   // onCancel(task: () => void): void
   // settled: boolean
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
      if (options?.awaited) pend(input)
      const $ion = ion(initialState as T | undefined, {
         [SUSPENSE_ION]: true,
         promise: input,
         error: null
      }) as SuspenseIon<T>

      input
         .then(value => $ion.state = value)
         .catch(err => {
            $ion.error = toError(err)
         })

      return $ion;
   }

   const $promise = ion(undefined as undefined | Promise<unknown>)
   const $ion = ion(initialState as unknown, {
      [SUSPENSE_ION]: true,
      get promise() {
         return $promise()
      },
      error: null as null | Error
   })

   ionicTask(() => {
      const promise = $promise.state = input($ion as SuspenseIon<T>);

      promise
         .then(value => $ion.state = value)
         .catch(err => {
            $ion.error = toError(err)
            throw err;
         })
   })
   if (options?.awaited) pend($ion.promise!)
   return $ion as SuspenseIon<T>;
}

export function asSuspenseIon<T>(value: SuspenseIon<T> | Promise<T>, options: { awaited: true }): SuspenseIon<T> {
   if (isSuspenseIon(value)) return value;
   return SuspenseIon(undefined, value)
}

function isSuspenseIon(value: unknown): value is SuspenseIon<unknown> {
   return isIon(value) && SUSPENSE_ION in value;
}

