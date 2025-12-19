import { isFunction, toError } from "@rue/utils";
import { __addDevName, queueIonicTask, Ion, MutableIon, isIon, runIonicTask, instantUpdate } from "../../../quarky/src";
import { pend, pendReload } from "./Await";



// export type SuspenseNodeInput = {
//    timeout?: number,
//    await?: Promise<any> | Promise<any>[],
//    standin?: () => JSXNode
//    catch?: (error: Error) => JSXNode
// }


// TODO: Suspense Ion must have value (T | undefined)
// QUESTION: should suspense boundaries be the default? No because you might not want to hold up rendering for something that is ok to be undefined
// Should { awaited: true } be the default? or { renderUndefined: true } or { dontAwait } or 

const SUSPENSE_ION = Symbol('suspense ion')


// TODO:
export type Suspense<T> = {
   [SUSPENSE_ION]: true,
   error: null | Error,
   pending: boolean,
   then: Promise<T>['then']
   catch: Promise<T>['then']
   finally: Promise<T>['then']
   // TODO: need a way to distinguish re'fetches' from initial 'fetch'
   // pending: boolean
   // cancel(): void
   // onCancel(task: () => void): void
}
export type SuspenseIon<T> = MutableIon<T> & Suspense<T>
export type Awaited<T> = MutableIon<T | undefined> & Suspense<T>
export type Resolved<T> = MutableIon<T> & {
   [SUSPENSE_ION]: true,
   pending: false,
   error: null, // different
   onLoaded(initial: boolean): unknown
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
   return !(ion.value instanceof Promise || ion.value instanceof Error)
}

export function isPending(ion: SuspenseIon<unknown>) {
   return ion.value instanceof Promise;
}

type SuspenseIonOptions = {
   awaited?: true | 'load',
   debounced?: number
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
      const $ion = Ion(initialState as T | undefined, {
         [SUSPENSE_ION]: true,
         pending: input,
         error: null,
      }) as SuspenseIon<T>

      input
         .then(value => {
            $ion.value = value;
            $ion.pending = false;
         })
         .catch(err => {
            $ion.error = toError(err)
            $ion.pending = false;
         })

      return $ion;
   }

   const $promise = Ion(null as null | Promise<T>)
   const $ion = Ion(initialState as unknown, {
      [SUSPENSE_ION]: true,
      get pending() {
         return $promise() ?? false
      },
      error: null as null | Error,
   })

   const debounce = Debouncer()

   if (options?.debounced) {
      debounce(options.debounced, () => {
         queueIonicTask(() => {
            const promise = $promise.value = input($ion as SuspenseIon<T>);

            promise
               .then(value => {
                  instantUpdate(() => {
                     $ion.value = value
                     $promise.value = null;
                  })
               })
               .catch(err => {
                  instantUpdate(() => {
                     $ion.error = toError(err)
                     $promise.value = null;
                  })
                  throw err;
               })
         })
      })
   }
   else {
      queueIonicTask(() => {
         console.log('>>> run ionic task', input)

         instantUpdate(() => {
            const promise = $promise.value = input($ion as SuspenseIon<T>)
            promise
               .then(value => {
                  instantUpdate(() => {
                     console.log('suspense.then', input)
                     $ion.value = value
                     console.log('END suspense.then', input)
                     $promise.value = null;
                  })
               })
               .catch(err => {
                  instantUpdate(() => {
                     $ion.error = toError(err)
                     $promise.value = null;
                  })
                  throw err;
               })
         });

      })
   }

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
   return isFunction(value) && SUSPENSE_ION in value;
}

function Debouncer() {
   let id: NodeJS.Timeout;
   return function debounce<T>(ms: number, fn: () => T): Promise<T> {
      if (id)
         clearTimeout(id)
      return new Promise<T>(resolve => {
         id = setTimeout(() => {
            resolve(fn())
         }, ms)
      })
   }
}