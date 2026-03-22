import { isFunction, isObject, toError } from "@rue/utils";
import { AsyncState, getActiveFlask } from "@rue/flask";
import { addToSuspense, SuspenseIon } from "./Suspense";
import { Ion, MutableIon } from "../ion/Ion";
import { watch } from "../reactivity/Watcher";
import { AsyncNode } from "./ooo";
import { PRELUDE } from "../reactivity/RenderCycle";

export let $suspense: SuspenseIon
export const [getAwaiting, suspenseStack] = AsyncState<SuspenseIon>('Suspense')
export const pushAwaiting = (n: SuspenseIon) => {$suspense = n; suspenseStack.push(n)}
export const popAwaiting = () => {suspenseStack.pop(); $suspense = getAwaiting()}

export function isPending(...args: any[]) {
   for (const entity of args) {
      if (entity instanceof Object && ASYNC_QUARK in entity) {
         if (entity[ASYNC_QUARK].$promise()) return true;
      }
   }
   return false
}

export function hasError(...args: any[]) {
   for (const entity of args) {
      if (entity instanceof Object && ASYNC_QUARK in entity) {
         if (entity[ASYNC_QUARK].$error()) return true;
      }
   }
   return false
}

export function isLoaded(...args: any[]) {
   for (const entity of args) {
      if (entity instanceof Object && ASYNC_QUARK in entity) {
         if (!entity[ASYNC_QUARK].$loaded()) return false;
      }
   }
   return true
}

// export type SuspenseNodeInput = {
//    timeout?: number,
//    await?: Promise<any> | Promise<any>[],
//    standin?: () => JSXNode
//    catch?: (error: Error) => JSXNode
// }


// TODO: Suspense Ion must have value (T | undefined)
// QUESTION: should suspense boundaries be the default? No because you might not want to hold up rendering for something that is ok to be undefined
// Should { awaited: true } be the default? or { renderUndefined: true } or { dontAwait } or 

export const ASYNC_QUARK = Symbol('async quark')
export function isAsyncIon(value: any): value is AsyncIon<any> {
   return value instanceof Object && ASYNC_QUARK in value
}

// RemoteIon({
//    watch: $a,
//    fetch: a => new Promise<number>((resolve, reject) => {
//       setTimeout(() => {
//          resolve(a * b);
//       }, Math.random() * 2000);
//    })
// })
export type AsyncQuark = {
   cancelIfFetching(): boolean
   $promise: Ion<Promise<unknown> | null>
   $error: Ion<Error | null>
   // status: 'pending' | 'error' | 'settled'
}

export type AsyncProps<T> = {
   asPromise: Promise<T> | null
   // error: null | Error,
   pending: Promise<T> | null,
   loaded: boolean,
}
// TODO:
export type $Async<T> = {
   [ASYNC_QUARK]: AsyncQuark & { $loaded: Ion<boolean> },
   asPromise: Promise<T> | null
   // error: null | Error,
   pending: Promise<T> | null,
   loaded: boolean,
   // fetching: boolean
   // cancelFetch: () => void

   // then: Promise<T>['then']
   // catch: Promise<T>['then']
   // finally: Promise<T>['then']

   // refetch(): void
   // TODO: need a way to distinguish re'fetches' from initial 'fetch'
   // pending: boolean
   // cancel(): void
   // onCancel(task: () => void): void
}
export type AsyncIon<T> = MutableIon<T> & $Async<T>
export type Awaited<T> = MutableIon<T | undefined> & $Async<T>
// export type Resolved<T> = MutableIon<T> & {
//    [SUSPENSE_ION]: true,
//    pending: false,
//    loading: boolean,
//    fetching: boolean,
//    error: null, // different
//    onLoaded(initial: boolean): unknown
//    // cancel(): void
//    // onCancel(task: () => void): void
// }


// export function assertResolved<T>(ion: AsyncIon<T>): asserts ion is Resolved<T> {
//    if (ion instanceof Promise)
//       throw Error('suspense not resolved yet')
//    if (ion instanceof Error)
//       throw Error('suspense has errored')
//    return;
// }

// export function isResolved<T>(ion: AsyncIon<T>): ion is Resolved<T> {
//    return !(ion.value instanceof Promise || ion.value instanceof Error)
// }

// export function isPending(ion: AsyncIon<unknown>) {
//    return ion.value instanceof Promise;
// }
export function toPromise(awaited: any) {
   if (awaited instanceof Promise) return awaited
   if (awaited instanceof Object && 'asPromise' in awaited) return awaited.asPromise
   return awaited
}

type AsyncIonOptions<T = any, U = any> = {
   '-as': (value: T) => U,
   '-awaited'?: true,
   '-suspense'?: SuspenseIon,
   '-debounced'?: number
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

//@ts-expect-error
window.$$_createAsyncIon = AsyncIon

export function AsyncIon<
   T,
   B extends boolean,
   OPT = undefined
>(
   fetch: ((ion: AsyncIon<T>) => Promise<T> | AsyncNode<T> | T),
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

   let pendingStart: DOMHighResTimeStamp | undefined;
   let resolve: ((value: T | PromiseLike<T>) => void) | null;
   let reject: ((reason?: any) => void) | null
   const $loaded = Ion(false)
   const $error = Ion(null as Error | null) // TODO:
   const $promise = Ion(new Promise((res, rej) => { resolve = res; reject = rej }) as null | Promise<T>)
   pendingStart = performance.now()
   const suspense = options?.['-suspense']
   const awaited = options?.['-awaited']
   if (!awaited && !suspense) {
      $promise.value!.catch(err => {
         if (err === 'cancelled') return;
         else throw err
      })
   }

   const $ion = Ion(initialState as unknown)

   const pendingState = suspense?.pendingState
   const quark = {
      $promise,
      cancelIfFetching,
      $loaded,
      $error
   }
   const $async = Ion(suspense && pendingState !== undefined ? () => suspense() ? pendingState : $ion() : () => $ion() as unknown, {
      [ASYNC_QUARK]: quark,
      get pending() {
         return $promise()
      },
      get loaded() {
         return $loaded()
      },
      get asPromise() {
         return $promise()
      }
      // $promise,
      // error: null as null | Error,
   })

   // const pendingPromises = new Set()
   let pendingPromise: Promise<unknown> | null = null

   function isFetching() {
      return Boolean(pendingPromise)
   }
   function cancelFetch() {
      console.warn('CANCEL FETCH')
      // for (const promise of pendingPromises){
      cancelledPromises.add(pendingPromise)
      pendingPromise = null
      // pendingPromises.delete(promise)
      // }
   }

   function cancelIfFetching() {
      if (isFetching()) {
         cancelFetch()
         return true;
      }
      return false
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

   if (suspense) addToSuspense(suspense, quark)
   const awaiting = awaited && getAwaiting()
   if (awaiting) addToSuspense(awaiting, quark)


   // const inSuspense = suspense || awaiting

   // let timeout: NodeJS.Timeout | undefined;
   // let timeoutResolve: NodeJS.Timeout | undefined;

   // TODO: optimization: handle fetch as promise outside of watch
   watch(fetch instanceof Promise ? () => fetch : fetch, ({ current: output }) => {
      const awaited = toPromise(output)
      if (awaited === pendingPromise) {
         return;
      }
      cancelIfFetching()
      if (awaited instanceof Promise) {
         pendingPromise = awaited

         // It's me. Hi. I'm the problem it's me. 
         // When this was instantUpdate, it caused a weird double fetchCities, and breaks multiply rapid fire
         // But when this is swiftUpdate, it causes inaccurate Suspense resolution
         // WHen this is instantUpdate or no update, it breaks multiply with suspense, on ever other click
         // NOTE: The solution should be NO UPDATE. It inherits the update from upstream... but why does so much behavior break?
         // The problem was rooted in effect queue scheduling. Effects failed to schedule because of queued and requeued flags. Solved by resetting requeued flag at the beginning of loop, not the end.
         if (!resolve) {
            // if (!suspense && !awaiting) {
            //    timeout = setTimeout(() => {
            //       // instantUpdate(() => {
            //          $promise.value = new Promise((res, rej) => { resolve = res; reject = rej })
            //          pendingStart = performance.now()
            //          if (!awaited && !suspense) {
            //             $promise.value.catch(err => {
            //                if (err === 'cancelled') return;
            //                else throw err
            //             })
            //          }
            //       // })
            //    }, 50)
            // }
            // else {
            $promise.value = new Promise((res, rej) => { resolve = res; reject = rej })
            // pendingStart = performance.now()
            if (!awaited && !suspense) {
               $promise.value.catch(err => {
                  if (err === 'cancelled') return;
                  else throw err
               })
            }
            // }
         }

         awaited
            .then(value => {
               // if (timeout !== undefined) {
               //    clearTimeout(timeout)
               //    timeout = undefined
               // }

               if (cancelledPromises.has(awaited)) {
                  console.warn('canceleld awaited', awaited)
                  cancelledPromises.delete(awaited)
                  if (reject) {
                     reject('cancelled')
                     resolve = null
                     reject = null
                  }
                  return;
               }
               pendingPromise = null;

               // const elapsed = pendingStart ? performance.now() - pendingStart : undefined

               if (resolve) {
                  // console.log('resolve to:', value)
                  resolve(value)
                  resolve = null
                  reject = null
               }

               // instantUpdate(() => {
               if (suspense?.() && pendingState === undefined) {
                  suspense()?.then(() => {
                     // instantUpdate(() => {
                     $ion.value = value
                     // })
                  })
               }
               else {
                  $ion.value = value
               }

               if ($promise.value) {
                  $promise.value = null;
                  // pendingStart = undefined
               }
               $loaded.value = true
               // })
               // if ($promise.value && elapsed && elapsed < 250) {

               //    // FIX: I don't know where to put this
               //    if (timeoutResolve !== undefined) {
               //       clearTimeout(timeoutResolve)
               //       timeoutResolve = undefined
               //    }
               //    timeoutResolve = setTimeout(() => {
               //       // instantUpdate(() => {
               //          $promise.value = null
               //          pendingStart = undefined
               //       // })
               //    }, 250 - elapsed)
               // }
            })
            .catch(err => {
               // pendingPromises.delete(output)
               pendingPromise = null
               // pendingStart = undefined
               if (reject) {
                  reject(err)
                  resolve = null
                  reject = null
               }
               // instantUpdate(() => {
               $error.value = toError(err)
               $promise.value = null
               $loaded.value = true
               // })
               if (err === 'cancelled') return;
               else throw err;
            })

      }
      else {
         // if (cancelledPromises.has(output)) {
         //    cancelledPromises.delete(output)
         //    if (reject) {
         //       reject('cancelled')
         //       resolve = null
         //       reject = null
         //    }
         // }
         // queueTask(() => {
         // instantUpdate(() => { // QUESTION: Why does async select break without this when it shouldn't need it?
         $error.value = null
         // $promise.value = null
         $ion.value = output
         // })
         // })
      }
   }, { phase: PRELUDE, eager: true })
   // }

   // if (options?.awaited) {
   //    const promise = $promise()
   //    if (promise) pend(promise)
   //    if (options?.awaited === true) {
   //       pendReload($promise)
   //    }
   // }
   return $async as any as AsyncIon<T>;
}

// export function asAsyncIon<T>(value: AsyncIon<T> | Promise<T>, options: { awaited: true }): AsyncIon<T> {
//    if (isAsyncIon(value)) return value;
//    return AsyncIon(undefined, value)
// }

// function isAsyncIon(value: unknown): value is AsyncIon<unknown> {
//    return isFunction(value) && SUSPENSE_ION in value;
// }

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


