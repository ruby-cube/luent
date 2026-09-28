import { isFunction, isObject, toError } from "@luent/utils";
import { AsyncState } from "@luent/flask";
import { addToSuspense, SuspenseIon } from "./Suspense";
import { Ion, MutableIon } from "../ion/Ion";
import { AsyncNode } from "./ooo";
import { createAtomicIon } from "../ion/AtomicIon";
import { createMemoizedDerivation } from "../ion/DerivationIon";
import { awaitsPrelude } from "../reactivity/IonicTask";
import { untracked } from "../reactivity/Compound";

export let $suspense: SuspenseIon
export const [getAwaiting, suspenseStack] = AsyncState<SuspenseIon>('Suspense')
export const pushAwaiting = (n: SuspenseIon) => { $suspense = n; suspenseStack.push(n) }
export const popAwaiting = () => { suspenseStack.pop(); $suspense = getAwaiting() }

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
//    observe: $a,
//    fetch: a => new Promise<number>((resolve, reject) => {
//       setTimeout(() => {
//          resolve(a * b);
//       }, Math.random() * 2000);
//    })
// })
export type AsyncQuark = {
  cancelIfFetching(): boolean
  $promise: Ion<Promise<unknown>>
  $error: Ion<Error | null>
  $pending: Ion<boolean>
  $loaded: Ion<boolean>
  // status: 'loading' | 'refetching' | 'error' | 'fulfilled'
}


// TODO:
export type $Async<T> = {
  [ASYNC_QUARK]: AsyncQuark & { $loaded: Ion<boolean> },

  error: null | Error,
  promised: Promise<T>,
  loaded: boolean,
  ifPending: <T, U>(suspense: T, value?: U) => T | U | undefined

  status: 'fetching' | 'fulfilled' | 'erred:fetch' | 'dispatching' | 'erred:dispatch'

  // refetch(): void
  // cancel(): void
  // onCancel(task: () => void): void

  // redispatch(): void
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
// export function toPromise(awaited: any) {
//   if (awaited instanceof Promise) return awaited
//   if (awaited instanceof Object && 'asPromise' in awaited) return awaited.asPromise
//   return awaited
// }

type AsyncIonOptions<T = any, U = any> = {
  '-as'?: (value: T) => U,
  // '-suspense'?: SuspenseIon
  // '-debounced'?: number
}

export function unpackAsyncIonArgs<T, OPT>(
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
  const $loaded = createAtomicIon(false)
  const $error = createAtomicIon(null as Error | null) // TODO:
  const $promise = createAtomicIon(new Promise((res, rej) => {
    resolve = res;
    reject = rej
  }))
  pendingStart = performance.now()
  // const suspense = options?.['-suspend']
  // if (!suspense) {
  $promise.value!.catch(err => {
    if (err === 'cancelled') return;
    else throw err
  })
  // }

  const $ion = createAtomicIon(initialState as unknown)

  // const pendingState = suspense?.pendingState
  const quark = {
    $promise,
    cancelIfFetching,
    $loaded,
    $error
  }
  const $async = createMemoizedDerivation(() => {
    const awaiting = getAwaiting()
    if (awaiting) addToSuspense(awaiting, quark)
    return $ion()
  }, {
    [ASYNC_QUARK]: quark,
    get pending() {
      return $promise()
    },
    get loaded() {
      return $loaded()
    },
    get asPromise() {
      return $promise()
    },
    // $promise,
    // error: null as null | Error,
  })

  if (import.meta.env.SSR) return $async as any as AsyncIon<T>;

  // const pendingPromises = new Set()
  let pendingPromise: Promise<unknown> | null = null
  const cancelledPromises = new Set()

  function isFetching() {
    return Boolean(pendingPromise)
  }

  function cancelFetch() {
    cancelledPromises.add(pendingPromise)
    pendingPromise = null
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


  // if (suspense) addToSuspense(suspense, quark)



  // const inSuspense = suspense || awaiting

  // let timeout: NodeJS.Timeout | undefined;
  // let timeoutResolve: NodeJS.Timeout | undefined;

  // TODO: optimization: handle fetch as promise outside of observe
  // observe(fetch instanceof Promise ? () => fetch : fetch, ({ current: output }) => {
  awaitsPrelude(oo => {
    // const output = fetch(oo)

    const maybePromise = toPromise(fetch(oo))
    if (maybePromise === pendingPromise) {
      return;
    }
    cancelIfFetching()
    if (maybePromise instanceof Promise) {
      pendingPromise = maybePromise

      // It's me. Hi. I'm the problem it's me. 
      // When this was instantUpdate, it caused a weird double fetchCities, and breaks multiply rapid fire
      // But when this is swiftUpdate, it causes inaccurate Suspense resolution
      // WHen this is instantUpdate or no update, it breaks multiply with suspense, on ever other click
      // NOTE: The solution should be NO UPDATE. It inherits the update from upstream... but why does so much behavior break?
      // The problem was rooted in reaction queue scheduling. Reactions failed to schedule because of queued and requeued flags. Solved by resetting requeued flag at the beginning of loop, not the end.
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
        // if (/* !awaited &&  */!suspense) {
        $promise.value.catch(err => {
          if (err === 'cancelled') return;
          else throw err
        })
        // }
        // }
      }

      maybePromise
        .then(value => {
          // if (timeout !== undefined) {
          //    clearTimeout(timeout)
          //    timeout = undefined
          // }

          if (cancelledPromises.has(maybePromise)) {
            cancelledPromises.delete(maybePromise)
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
          // if (suspense?.() && pendingState === undefined) {
          //   suspense()?.then(() => {
          //     // instantUpdate(() => {
          //     console.log('$$$ update ion: suspense.then')
          //     $ion.value = value
          //     // })
          //   })
          // }
          // else {
          console.log('$$$ update ion', value)
          $ion.value = value
          // }

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
      if (resolve) {
        resolve(output)
        resolve = null
        reject = null
      }
      $error.value = null
      $promise.value = null
      console.log('$$$ update ion: output')
      $ion.value = output
    }
  })
  // }, { phase: PRELUDE, eager: true })

  return $async as any as AsyncIon<T>;
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



type AsyncIonSetup<T = any, U = any> = {
  initialState: U | undefined,
  fetch: (observe: (fn: () => any) => any) => Promise<T> | T,
  wrap: ((value: T) => U) | undefined
}


export function createAsyncIon<T>(setup: AsyncIonSetup<T>) {
  const { initialState, fetch, wrap = o => o } = setup;

  // Pending state
  let resolve: ((value: T | PromiseLike<T>) => void) | null;
  let reject: ((reason?: any) => void) | null

  function Pending() {
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    })
    promise.catch(error => {
      if (error === 'cancelled') {
        console.log('caught error', error)
        return;
      }
      else throw error
    })
    return promise
  }



  const $state = createAtomicIon(initialState);
  const $loaded = createAtomicIon(false) as MutableIon<boolean>
  const $pending = createAtomicIon(true) as MutableIon<boolean>
  const $error = createAtomicIon(null) as MutableIon<null | Error>
  const $promised = createAtomicIon(Pending()) as MutableIon<Promise<T>>

  const quark = {
    $promise: $promised,
    cancelIfFetching,
    $loaded,
    $error,
    $pending
  }

  const $fetched = createMemoizedDerivation(() => {
    untracked(() => emitAwait(quark))
    return $state()
  }, ({
    [ASYNC_QUARK]: quark,

    get loaded() {
      return $loaded()
    },

    get error() {
      return $error()
    },

    get promised() {
      return $promised()
    },

    ifPending,

    // then(onfulfilled, onrejected) {
    //   console.log('THEN', onfulfilled)
    //   return $promised().then(onfulfilled, onrejected)
    // },

    // catch(onrejected) {
    //   return $promised().catch(onrejected)
    // },

    // finally(onfinally) {
    //   return $promised().finally(onfinally)
    // },

    get status() {
      if ($pending()) return 'fetching';
      if ($error()) return 'erred';
      return 'fulfilled'
    }
  } satisfies $Async<T>))

  if (import.meta.env.SSR) return $fetched;

  // Cancellation
  let pendingPromise: PromiseLike<unknown> | null = null
  const cancelledPromises = new Set()

  function isFetching() {
    return Boolean(pendingPromise)
  }

  function cancelFetch() {
    cancelledPromises.add(pendingPromise)
    pendingPromise = null
    if (reject) {
      console.log('rejecting')
      reject('cancelled')
      resolve = null;
      reject = null;
    }
  }

  function cancelIfFetching() {
    if (isFetching()) {
      cancelFetch()
      return true;
    }
    return false
  }


  // ifPending

  function ifPending<T, U>(suspense: T, value?: U): T | U | undefined {
    return $pending() ? suspense : value
  }

  // Observe
  awaitsPrelude(oo => {
    const promise = toPromise(fetch(oo)) as PromiseLike<any>
    if (promise === pendingPromise) return;

    cancelIfFetching()
    pendingPromise = promise
    if (!resolve) {
      $promised.value = Pending()
      $pending.value = true
    }

    const p = promise.then(res => {
      const value = wrap(res)
      if (cancelledPromises.has(promise)) {
        cancelledPromises.delete(promise)
        return;
      }
      pendingPromise = null

      if (resolve) {
        resolve(value)
        resolve = null;
        reject = null;
      }
      console.log('setting async::', value, fetch)
      $state.value = value
      $pending.value = false
      $loaded.value = true
    })

    if ('catch' in p && typeof p.catch === 'function') {
      (p as Promise<unknown>).catch(error => {
        pendingPromise = null
        if (reject) {
          reject(error)
          resolve = null
          reject = null
        }
        $error.value = toError(error)
        $pending.value = false
        $loaded.value = true
      })
    }
  })

  return $fetched
}

export function toPromise<T>(value: T): T extends Promise<infer V> ? Promise<V> : T {
  if (!isObject(value)) {
    return Promise.resolve(value) as T extends Promise<infer V> ? Promise<V> : T
  }
  if (isPromiseLike(value)) return value as T extends Promise<infer V> ? Promise<V> : T
  return Promise.resolve(value) as T extends Promise<infer V> ? Promise<V> : T
}

function isPromiseLike(value: unknown): value is Promise<unknown> {
  return (
    value != null &&
    (typeof value === "object" || typeof value === "function") &&
    typeof (value as any).then === "function"
  )
}



function emitAwait(quark: AsyncQuark) {
  const awaiting = getAwaiting()
  if (awaiting) addToSuspense(awaiting, quark)
  // TODO: track pending state for derivations
}

