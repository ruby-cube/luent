import { isFunction, toError } from "@rue/utils";
import { Ion, MutableIon, watch, instantUpdate, queueIonicPrelude, swiftUpdate, PRELUDE, $_derivation, untracked, queueTask } from "@rue/quarky";
import { pend, pendReload } from "./Await";
import { getActiveFlask } from "@rue/flask";
import { QUARK } from "../../../quarky/src/abstract/Quark";



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
export type $Async<T> = {
   [SUSPENSE_ION]: true,
   error: null | Error,
   pending: Promise<T> | null,
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
export type AsyncIon<T> = MutableIon<T> & $Async<T>
export type Awaited<T> = MutableIon<T | undefined> & $Async<T>
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


export function assertResolved<T>(ion: AsyncIon<T>): asserts ion is Resolved<T> {
   if (ion instanceof Promise)
      throw Error('suspense not resolved yet')
   if (ion instanceof Error)
      throw Error('suspense has errored')
   return;
}

export function isResolved<T>(ion: AsyncIon<T>): ion is Resolved<T> {
   return !(ion.value instanceof Promise || ion.value instanceof Error)
}

export function isPending(ion: AsyncIon<unknown>) {
   return ion.value instanceof Promise;
}


type AsyncIonOptions = {
   awaited?: true | 'load',
   suspense?: Suspense,
   debounced?: number
}

function unpackAsyncIonArgs<T, OPT>(
   arg1: T | ((ion: AsyncIon<T>) => Promise<T>),
   arg2?: ((ion: AsyncIon<T>) => Promise<T>) | OPT & AsyncIonOptions,
   arg3?: OPT & AsyncIonOptions
) {
   const fetch = isFunction(arg1) ? arg1 : isFunction(arg2) ? arg2 : () => { throw new Error('fetch not provided') }

   return {
      fetch,
      initialState: arg1 !== fetch ? arg1 : undefined,
      options: arg1 === fetch ? arg2 as OPT & AsyncIonOptions : arg3
   }
}

export function AsyncIon<
   T,
   B extends boolean,
   OPT = undefined
>(
   fetch: ((ion: AsyncIon<T>) => Promise<T> | T),
   options?: OPT & AsyncIonOptions
): OPT extends undefined ? AsyncIon<T> : B extends true | 'load' | 'reload' ? Awaited<T> : AsyncIon<T>
export function AsyncIon<
   T,
   B extends boolean,
   OPT = undefined
>(
   initialState: T | undefined,
   fetch: ((ion: AsyncIon<T>) => Promise<T>),
   options?: OPT & AsyncIonOptions
): OPT extends undefined ? AsyncIon<T> : B extends true | 'load' | 'reload' ? Awaited<T> : AsyncIon<T>
export function AsyncIon<
   T,
   B extends boolean,
   OPT = undefined
>(
   arg1: T | ((ion: AsyncIon<T>) => Promise<T>),
   arg2?: ((ion: AsyncIon<T>) => Promise<T>) | OPT & AsyncIonOptions,
   arg3?: OPT & AsyncIonOptions
): OPT extends undefined ? AsyncIon<T> : B extends true | 'load' | 'reload' ? Awaited<T> : AsyncIon<T> {
   const { initialState, fetch, options } = unpackAsyncIonArgs(arg1, arg2, arg3)

   // if (input instanceof Promise) {
   //    if (options?.awaited) {
   //       pend(input)
   //    }
   //    const $ion = Ion(initialState as T | undefined, {
   //       [SUSPENSE_ION]: true,
   //       pending: input,
   //       error: null,
   //    }) as AsyncIon<T>

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
   const $promise = Ion(new Promise((res, rej) => { resolve = res; reject = rej }) as null | Promise<T>)
   if (!options?.awaited && !options?.suspense) {
      $promise.value!.catch(err => {
         if (err === 'cancelled') return;
         else throw err
      })
   }
   const $ion = Ion(initialState as unknown, {
      [SUSPENSE_ION]: true,
      get pending() {
         return $promise()
      },
      get loaded() {
         return $loaded()
      },
      $promise,
      error: null as null | Error,
   })
   
   const pendingPromises: Set<Promise<unknown>> = new Set()
   function isFetching() {
      return Boolean(pendingPromises.size)
   }
   function cancelFetch() {
      for (const promise of pendingPromises) {
         cancelledPromises.add(promise)
         pendingPromises.delete(promise)
      }
   }

   // const debounce = Debouncer()

   // if (options?.debounced) {
   //    debounce(options.debounced, () => {
   //       queueIonicPrelude(() => {
   //          const promise = $promise.value = fetch($ion as AsyncIon<T>);

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
   const suspense = options?.suspense
   suspense?.[SUSPENSE_QUARK].start($ion as unknown as AsyncIon<T>)
   queueIonicPrelude(() => {
      if (isFetching()) cancelFetch()
      const output = fetch($ion as unknown as AsyncIon<T>)
      if (output instanceof Promise) {
         pendingPromises.add(output)

         // NOTE: It's me. Hi. I'm the problem it's me. When this was instantUpdate, it caused a weird double fetchCities
         swiftUpdate(() => {
            if (!resolve) {
               $promise.value = new Promise((res, rej) => { resolve = res; reject = rej })
               if (!options?.awaited && !options?.suspense) $promise.value.catch(err => {
                  if (err === 'cancelled') return;
                  else throw err
               })
            }
            output
               .then(value => {
                  if (cancelledPromises.has(output)) {
                     cancelledPromises.delete(output)
                     if (reject) {
                        reject('cancelled')
                        resolve = null
                        reject = null
                     }
                     instantUpdate(() => $promise.value = $promise())
                     return;
                  }
                  pendingPromises.delete(output)
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
                  console.log('))) error')
                  pendingPromises.delete(output)
                  if (reject) {
                     reject(err)
                     resolve = null
                     reject = null
                  }
                  instantUpdate(() => {
                     $ion.error = toError(err)
                     $promise.value = null
                     $loaded.value = true
                  })
                  if (err === 'cancelled') return;
                  else throw err;
               })
         });
      }
      else {
         if (cancelledPromises.has(output)) {
            cancelledPromises.delete(output)
            if (reject) {
               reject('cancelled')
               resolve = null
               reject = null
            }
         }
         instantUpdate(() => {
            $ion.error = null
            $promise.value = null
            $ion.value = output
         })
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
   return $ion as any as AsyncIon<T>;
}

export function asAsyncIon<T>(value: AsyncIon<T> | Promise<T>, options: { awaited: true }): AsyncIon<T> {
   if (isAsyncIon(value)) return value;
   return AsyncIon(undefined, value)
}

function isAsyncIon(value: unknown): value is AsyncIon<unknown> {
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


export type Suspense = Ion<Promise<void> | null> & { [SUSPENSE_QUARK]: SuspenseQuark }

type SuspenseQuark = {
   // initial: boolean
   // include($async: AsyncIon<unknown>): void
   start($async: AsyncIon<unknown>): void
}

const SUSPENSE_QUARK = Symbol('suspense quark')


// TODO: Suspense race

export function Suspense() {
   const asyncIons = new Set<AsyncIon<unknown>>()
   let promiseCount: number = 0;
   let cancelledCount: number = 0;
   let resolve: (() => void) | null
   let reject: ((reason?: any) => void) | null
   // const $pending = Ion(() => {
   //    for (const ion of asyncIons) {
   //       if (ion.pending) return true
   //    }
   //    return false
   // })

   const isPending = () => {
      for (const ion of asyncIons) {
         if (ion.pending) return true
      }
      return false
   }


   const $suspense = Ion(new Promise<void>((res, rej) => { resolve = res; reject = rej }) as Promise<void> | null, {
      [SUSPENSE_QUARK]: {
         initial: true,
         // include($async: AsyncIon<unknown>) {
         //    asyncIons.push($async)
         //    getActiveFlask().onDiscard(() => {
         //       asyncIons.splice(asyncIons.indexOf($async), 1)
         //    })
         // },
         start($async: AsyncIon<unknown>) {
            asyncIons.add($async)
            getActiveFlask().onDiscard(() => {
               asyncIons.delete($async)
            })
            let initial = true;
            watch(Ion(() => $async.pending), ({ current: promise, previous }) => {
               if (promise === null) {
                  if (previous) promiseCount--
                  console.log('- resolved', promiseCount)
                  if (promiseCount === 0 && !isPending()) {
                     console.log('equal')
                     if (resolve) {
                        resolve()
                        resolve = null
                        reject = null
                     }
                     swiftUpdate(() => $suspense.value = null)
                  }
                  return;
               }
               if (initial || previous === null) promiseCount++
               if (initial) initial = false
               console.log('+promise', promiseCount)
               if (!$suspense()) $suspense.value = new Promise<void>((res, rej) => { resolve = res; reject = rej });

               promise
                  .catch(err => {
                     if (err === 'cancelled') {
                        if (!$async.pending)
                           promiseCount--
                        console.log('-resolved (cancelled)', promiseCount, cancelledCount)
                        if (promiseCount === 0 && !isPending()) {
                           console.log('equal (canceled)')
                           if (resolve) {
                              resolve()
                              resolve = null
                              reject = null
                           }
                           swiftUpdate(() => {
                              console.log('$$$ $suspense.value (cancelled)')
                              return $suspense.value = null
                           }) // NOTE: for some unknown reason, this is needed for promiseCount++ to happen
                        }
                        return;
                     }
                     promiseCount = 0
                     if (reject) {
                        reject(err)
                        resolve = null
                        reject = null
                     }
                     swiftUpdate(() => {
                        // $error.value = toError(err);
                        $suspense.value = null
                     })
                  })
            }, { phase: PRELUDE, eager: true })
         }
      }
   })

   return $suspense
}


// 5 ** new promise
//  +promise 1
//  +promise 2
//  +promise 3
//  +promise 4
//  +promise 5
//  - resolved (null) 4 0
//  ** new promise
//  +promise 5
//  - resolved (null) 4 0
//  -resolved (cancelled) 3 1
//  -resolved (cancelled) 2 2
//  -resolved (cancelled) 1 3
//  -resolved (cancelled) 0 4
//  $$$ $suspense.value (cancelled)
// 4 ** new promise
//  - cancelledCount 3
//  +promise 1
//  - cancelledCount 2
//  +promise 2
//  - cancelledCount 1
//  +promise 3
//  - cancelledCount 0
//  +promise 4
//  - resolved (null) 3 0
//  - resolved (null) 2 0
//  - resolved (null) 1 0
//  - resolved (null) 0 0
//  equal
//  $$$ $suspense.value (null)