import { isFunction, toError } from "@rue/utils";
import { Ion, MutableIon, watch, instantUpdate, queueIonicPrelude, swiftUpdate, PRELUDE, $_derivation, untracked, queueTask, runIonicTask, SYNC, TICK, $activeUpdate } from "@rue/quarky";
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

   const $ion = Ion(initialState as unknown)
    const suspense = options?.suspense
   const pendingValue = options?.suspense?.[SUSPENSE_QUARK].pendingValue

   const $async = Ion(suspense && pendingValue !== undefined ? () => suspense() ? pendingValue : $ion() : () => $ion() as unknown, {
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
  
   suspense?.[SUSPENSE_QUARK].start(quark)
   const awaiting = options?.awaited && getAwaiting()
   awaiting?.[SUSPENSE_QUARK].start(quark)


   // const inSuspense = suspense || awaiting

   watch(fetch, ({ current: output }) => {
      cancelIfFetching()

      if (output instanceof Promise) {
         pendingPromise = output

         // It's me. Hi. I'm the problem it's me. 
         // When this was instantUpdate, it caused a weird double fetchCities, and breaks multiply rapid fire
         // But when this is swiftUpdate, it causes inaccurate Suspense resolution
         // WHen this is instantUpdate or no update, it breaks multiply with suspense, on ever other click
         // NOTE: The solution should be NO UPDATE. It inherits the update from upstream... but why does so much behavior break?
         // The problem was rooted in effect queue scheduling. Effects failed to schedule because of queued and requeued flags. Solved by resetting requeued flag at the beginning of loop, not the end.
         if (!resolve) {
            console.log('NEW PROMISE')
            $promise.value = new Promise((res, rej) => { resolve = res; reject = rej })
            if (!options?.awaited && !options?.suspense) {
               $promise.value.catch(err => {
                  if (err === 'cancelled') return;
                  else throw err
               })
            }
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
                  console.log('(CANCELED', $promise(), "'")
                  return;
               }

               pendingPromise = null;
               if (resolve) {
                  // console.log('resolve to:', value)
                  resolve(value)
                  resolve = null
                  reject = null
               }

               instantUpdate(() => {
                  if (suspense?.() && pendingValue === undefined) {
                     suspense()?.then(() => {
                        instantUpdate(() => {
                           $ion.value = value
                        })
                     })
                  }
                  else {
                     $ion.value = value
                  }
                  console.log('NUL PROMISE! (resolve to)', value)
                  $promise.value = null;
                  $loaded.value = true
               })
            })
            .catch(err => {
               // pendingPromises.delete(output)
               pendingPromise = null
               if (reject) {
                  reject(err)
                  resolve = null
                  reject = null
               }
               instantUpdate(() => {
                  $async.error = toError(err)
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
         // queueTask(() => {
         instantUpdate(() => { // QUESTION: Why does async select break without this when it shouldn't need it?
            $async.error = null
            // $promise.value = null
            $ion.value = output
         })
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
   oo: Promise<unknown> | null
   await(): void
   retry(): void
   [SUSPENSE_QUARK]: SuspenseQuark
}

type SuspenseQuark = {
   start(quark: AsyncQuark): void
   pendingValue: any
} & AsyncQuark

export const SUSPENSE_QUARK = Symbol('suspense quark')

type AsyncQuark = {
   cancelIfFetching(): boolean
   $promise: Ion<Promise<unknown> | null>
}

export function Suspense(pendingValue?: unknown) {
   const quarks = new Set<AsyncQuark>()
   let resolve: (() => void) | null
   let reject: ((reason?: any) => void) | null

   const pendingPromises = new Set()

   const isPending = () => {
      for (const { $promise } of quarks) {
         if ($promise()) return true
      }
      return false
   }

   let startTime = performance.now();
   function timecheck() {
      const delta = performance.now() - startTime
      console.log('suspense took', delta)
   }

   const $suspense = Ion(null as Promise<unknown> | null, {
      initial: true,
      get oo(): Promise<unknown> | null {
         return $suspense()
      },
      await(): Suspense {
         return $suspense()
      },
      retry() {
         console.warn('NOT YET IMPLEMENTED')
      },
      [SUSPENSE_QUARK]: {
         pendingValue,
         get $promise(): Ion<Promise<unknown> | null> {
            return $suspense
         },
         get quarkCount(){
            return quarks.size
         },
         cancelIfFetching() {
            console.warn('group cancel if fetching')
            let success = false
            for (const { cancelIfFetching, $promise } of quarks) {
               const cancelled = success = cancelIfFetching()
               if (cancelled) pendingPromises.delete($promise()) // TODO: not sure if this is correct...
            }
            return success
         },
         start(quark: AsyncQuark) {
            // console.log('start suspense', quark, quarks.size)
            const { $promise } = quark
            if ($promise() && !$suspense()) {
               console.log('++ new promise')
               $suspense.value = new Promise<void>((res, rej) => { resolve = res; reject = rej });
               startTime = performance.now()
            }
            console.log('starting suspense', $promise)
            quarks.add(quark)
            getActiveFlask().onDiscard(() => {
               if (quark.cancelIfFetching()) pendingPromises.delete($promise())
               console.log('discarding quark')
               quarks.delete(quark)
            })

            watch($promise, ({ current: promise, previous, eager }) => {
               if (!eager && promise === previous) {
                  console.log('same')
                  return;
               }
               if (promise === null) {
                  if (!$suspense()) console.warn( "should be impossible. $suspense is null while promise turned null", previous)
                  pendingPromises.delete(previous)
                  if (pendingPromises.size === 0 && !isPending()) {
                     console.log('reset', 0)
                     if (resolve) {
                        timecheck()
                        resolve()
                        resolve = null
                        reject = null
                     }
                     console.log('suspense to null', $suspense.value)
                     $suspense.value = null
                     if ($suspense.initial) $suspense.initial = false
                  }
                  return;
               }

               pendingPromises.add(promise)
               console.log('+promise', pendingPromises.size, quarks.size)
               if ($suspense.initial) $suspense.initial = false
               if (!$suspense()) {
                  startTime = performance.now()
                  console.log('++ new suspense promise')
                  $suspense.value = new Promise<void>((res, rej) => { resolve = res; reject = rej });
               }

               promise
                  .catch(err => {
                     pendingPromises.delete(promise)
                     if (err === 'cancelled') {
                        return;
                     }
                     console.log('ERROR')
                     if (reject) {
                        reject(err)
                        resolve = null
                        reject = null
                     }
                     instantUpdate(() => {
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