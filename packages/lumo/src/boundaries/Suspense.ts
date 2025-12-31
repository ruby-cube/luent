import { isFunction, toError } from "@rue/utils";
import { __addDevName, queueIonicTask, Ion, MutableIon, isIon, runIonicTask, instantUpdate, queueIonicPrelude, swiftUpdate, untracked } from "../../../quarky/src";
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


// RemoteIon({
//    watch: $a,
//    fetch: a => new Promise<number>((resolve, reject) => {
//       setTimeout(() => {
//          resolve(a * b);
//       }, Math.random() * 2000);
//    })
// })

// TODO:
export type Suspense<T> = {
   [SUSPENSE_ION]: true,
   error: null | Error,
   pending: boolean,
   loaded: boolean,
   fetching: boolean
   cancelFetch: () => void
   then: Promise<T>['then']
   catch: Promise<T>['then']
   finally: Promise<T>['then']
   refetch(): void
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
   loading: boolean,
   fetching: boolean,
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

function unpackAsyncIonArgs<T, OPT>(
   arg1: T | ((ion: SuspenseIon<T>) => Promise<T>),
   arg2?: ((ion: SuspenseIon<T>) => Promise<T>) | OPT & SuspenseIonOptions,
   arg3?: OPT & SuspenseIonOptions
) {
   const fetch = isFunction(arg1) ? arg1 : isFunction(arg2) ? arg2 : () => { throw new Error('fetch not provided') }

   return {
      fetch,
      initialState: arg1 !== fetch ? arg1 : undefined,
      options: arg1 === fetch ? arg2 : arg3
   }
}

export function SuspenseIon<
   T,
   B extends boolean,
   OPT = undefined
>(
   fetch: ((ion: SuspenseIon<T>) => Promise<T> | T),
   options?: OPT & SuspenseIonOptions
): OPT extends undefined ? SuspenseIon<T> : B extends true | 'load' | 'reload' ? Awaited<T> : SuspenseIon<T>
export function SuspenseIon<
   T,
   B extends boolean,
   OPT = undefined
>(
   initialState: T | undefined,
   fetch: ((ion: SuspenseIon<T>) => Promise<T>),
   options?: OPT & SuspenseIonOptions
): OPT extends undefined ? SuspenseIon<T> : B extends true | 'load' | 'reload' ? Awaited<T> : SuspenseIon<T>
export function SuspenseIon<
   T,
   B extends boolean,
   OPT = undefined
>(
   arg1: T | ((ion: SuspenseIon<T>) => Promise<T>),
   arg2?: ((ion: SuspenseIon<T>) => Promise<T>) | OPT & SuspenseIonOptions,
   arg3?: OPT & SuspenseIonOptions
): OPT extends undefined ? SuspenseIon<T> : B extends true | 'load' | 'reload' ? Awaited<T> : SuspenseIon<T> {
   const { initialState, fetch, options } = unpackAsyncIonArgs(arg1, arg2, arg3)

   // if (input instanceof Promise) {
   //    if (options?.awaited) {
   //       pend(input)
   //    }
   //    const $ion = Ion(initialState as T | undefined, {
   //       [SUSPENSE_ION]: true,
   //       pending: input,
   //       error: null,
   //    }) as SuspenseIon<T>

   //    input
   //       .then(value => {
   //          $ion.value = value;
   //          $ion.pending = false;
   //       })
   //       .catch(err => {
   //          $ion.error = toError(err)
   //          $ion.pending = false;
   //       })

   //    return $ion;
   // }

   let resolve: ((value: T | PromiseLike<T>) => void) | null;
   let reject: ((reason?: any) => void) | null
   const $loaded = Ion(false)
   const $promise = Ion(new Promise((res, rej) => { resolve = res; reject = rej }) as undefined | null | Promise<T>)

   const $ion = Ion(initialState as unknown, {
      [SUSPENSE_ION]: true,
      get pending() {
         return $promise()
      },
      get loaded() {
         return $loaded()
      },
      fetching: false,
      cancelFetch() {
         cancelledPromises.add(currentFetchPromise)
      },
      $promise,
      error: null as null | Error,
   })

   let currentFetchPromise: null | Promise<unknown> = null;

   // const debounce = Debouncer()

   // if (options?.debounced) {
   //    debounce(options.debounced, () => {
   //       queueIonicPrelude(() => {
   //          const promise = $promise.value = fetch($ion as SuspenseIon<T>);

   //          promise
   //             .then(value => {
   //                if (resolveInitial) {
   //                   resolveInitial(value)
   //                   resolveInitial = null
   //                }
   //                swiftUpdate(() => {
   //                   $ion.value = value
   //                   $promise.value = null;
   //                })
   //             })
   //             .catch(err => {
   //                swiftUpdate(() => {
   //                   $ion.error = toError(err)
   //                   $promise.value = null;
   //                })
   //                throw err;
   //             })
   //       })
   //    })
   // }
   // else {
   const cancelledPromises = new Set()
   queueIonicPrelude(() => {
      const output = fetch($ion as SuspenseIon<T>)
      if (output instanceof Promise) {
         $ion.fetching = true

         // NOTE: It's me. Hi. I'm the problem it's me. When this was instantUpdate, it caused a weird double fetchCities
         swiftUpdate(() => {
            if (!resolve) { $promise.value = new Promise((res, rej) => { resolve = res; reject = rej }) }
            currentFetchPromise = output
            output
               .then(value => {
                  if (cancelledPromises.has(output)) {
                     cancelledPromises.delete(output)
                     return;
                  }
                  $ion.fetching = false;
                  currentFetchPromise = null
                  if (resolve) {
                     resolve(value)
                     resolve = null
                     reject = null
                  }
                  instantUpdate(() => {
                     $ion.value = value
                     $promise.value = null;
                     $loaded.value = true
                  })
               })
               .catch(err => {
                  $ion.fetching = false;
                  currentFetchPromise = null
                  if (reject) {
                     reject(err)
                     resolve = null
                     reject = null
                  }
                  instantUpdate(() => {
                     $ion.error = toError(err)
                     $promise.value = null;
                     $loaded.value = true
                  })
                  throw err;
               })
         });
      }
      else {
         instantUpdate(() => $ion.value = output)
      }
   })
   // }

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