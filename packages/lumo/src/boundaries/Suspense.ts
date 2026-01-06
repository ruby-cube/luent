import { isFunction, toError } from "@rue/utils";
import { Ion, MutableIon, watch, instantUpdate, queueIonicPrelude, swiftUpdate, PRELUDE, $_derivation, untracked, queueTask, runIonicTask, SYNC } from "@rue/quarky";
import { getActiveFlask } from "@rue/flask";
import { getAwaiting } from "./Await";



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
   awaited?: true,
   suspense?: Suspense,
   debounced?: number
}

function unpackAsyncIonArgs<T, OPT>(
   arg1: T | (() => Promise<T>),
   arg2?: (() => Promise<T>) | OPT & AsyncIonOptions,
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
   fetch: (() => Promise<T>),
   options?: OPT & AsyncIonOptions
): OPT extends undefined ? AsyncIon<T> : B extends true | 'load' | 'reload' ? Awaited<T> : AsyncIon<T>
export function AsyncIon<
   T,
   B extends boolean,
   OPT = undefined
>(
   arg1: T | (() => Promise<T>),
   arg2?: (() => Promise<T>) | OPT & AsyncIonOptions,
   arg3?: OPT & AsyncIonOptions
): OPT extends undefined ? AsyncIon<T> : B extends true | 'load' | 'reload' ? Awaited<T> : AsyncIon<T> {
   const { initialState, fetch, options } = unpackAsyncIonArgs(arg1, arg2, arg3)

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
      console.warn('CANCEL FETCH', fetch)
      for (const promise of pendingPromises) {
         cancelledPromises.add(promise)
         pendingPromises.delete(promise)
      }
   }

   function cancelIfFetching() {
      if (isFetching()) {
         cancelFetch()
         return true;
      }
      return false
   }

   const quark = { $promise, cancelIfFetching }

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
   suspense?.[SUSPENSE_QUARK].start(quark)
   const awaiting = options?.awaited && getAwaiting()
   awaiting?.[SUSPENSE_QUARK].start(quark)


   // const inSuspense = suspense || awaiting

   queueIonicPrelude(() => {
      // if (awaiting) {
      //    awaiting[SUSPENSE_QUARK].cancelIfFetching()
      // }
      // else 
      cancelIfFetching()

      const output = fetch()
      if (output instanceof Promise) {
         pendingPromises.add(output)

         // NOTE: It's me. Hi. I'm the problem it's me. When this was instantUpdate, it caused a weird double fetchCities
         if (!resolve) {
            swiftUpdate(() => {
               $promise.value = new Promise((res, rej) => { resolve = res; reject = rej })
               if (!options?.awaited && !options?.suspense) {
                  $promise.value.catch(err => {
                     if (err === 'cancelled') return;
                     else throw err
                  })
               }
            });
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
            // $promise.value = null
            $ion.value = output
         })
      }
   })
   // }

   // if (options?.awaited) {
   //    const promise = $promise()
   //    if (promise) pend(promise)
   //    if (options?.awaited === true) {
   //       pendReload($promise)
   //    }
   // }
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


export type Suspense = Ion<Promise<void> | null> & {
   initial: boolean
   oo: boolean
   retry(): void
   [SUSPENSE_QUARK]: SuspenseQuark
}

type SuspenseQuark = {
   start(quark: AsyncQuark): void
} & AsyncQuark

export const SUSPENSE_QUARK = Symbol('suspense quark')

type AsyncQuark = {
   cancelIfFetching(): boolean
   $promise: Ion<Promise<unknown> | null>
}

export function Suspense() {
   const quarks = new Set<AsyncQuark>()
   let promiseCount: number = 0;
   let cancelledCount: number = 0;
   let resolve: (() => void) | null
   let reject: ((reason?: any) => void) | null
   const isPending = () => {
      for (const { $promise } of quarks) {
         if ($promise()) return true
      }
      return false
   }

   const $suspense = Ion(new Promise<void>((res, rej) => { resolve = res; reject = rej }) as Promise<void> | null, {
      initial: true,
      get oo(): boolean {
         return Boolean($suspense())
      },
      retry() {
         console.warn('NOT YET IMPLEMENTED')
      },
      [SUSPENSE_QUARK]: {
         get $promise(): Ion<Promise<unknown> | null> {
            return $suspense
         },
         cancelIfFetching() {
            let success = false
            for (const { cancelIfFetching } of quarks) {
               const cancelled = success = cancelIfFetching()
               if (cancelled) promiseCount-- // TODO: not sure if this is correct...
            }
            return success
         },
         start(quark: AsyncQuark) {
            const { $promise } = quark
            if (!$suspense()) {
               console.log('+ new promise')
               $suspense.value = new Promise<void>((res, rej) => { resolve = res; reject = rej });
            }
            console.log('starting suspense', $promise)
            quarks.add(quark)
            getActiveFlask().onDiscard(() => {
               if (quark.cancelIfFetching()) promiseCount--
               console.log('discarding quark')
               quarks.delete(quark)
            })
            let initial = true
            watch($promise, ({ current: promise, previous }) => {
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
                     // instantUpdate(() => { // NOTE: I'm the problem. It's me. Nested updates interferes with each other :( causing effects to run on every other state change
                     console.log('suspense to null', $suspense.value)
                     // if (count === 2) debugger;
                     $suspense.value = null // FIX: this should cause Await watcher to trigger, but it doesn't
                     // })
                  }
                  if (initial) initial = false
                  if ($suspense.initial) $suspense.initial = false
                  return;
               }
               if (initial || previous === null) promiseCount++
               if (initial) initial = false
               if ($suspense.initial) $suspense.initial = false
               console.log('+promise', promiseCount)
               if (!$suspense()) {
                  console.log('+ new promise')
                  $suspense.value = new Promise<void>((res, rej) => { resolve = res; reject = rej });
               }

               promise
                  .catch(err => {
                     if (err === 'cancelled') {
                        if (!$promise())
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


// +++ FETCH () => db.fetchStates
// +++ FETCH () => $activeState()
// RENDER PLACEHOLDER
// +++ FETCH () => $activeState()
// +++ no promise () => $activeState()

// RENDER PLACEHOLDER
// +++ FETCH () => db.fetchStates
// +++ promise () => db.fetchStates
// +++ FETCH () => $activeState()
// +++ no promise () => $activeState()
// +++ resolved () => db.fetchStates
// +++ FETCH () => $activeState()
// +++ resolved () => $activeState()
// *** C false null
// RENDER RESOLVED
// +++ FETCH async () => {    await $cities
// +++ resolved async () => {    await $cities