import { AsyncNode, AsyncSeries, INTERNAL } from "./ooo";
import { AnyObject } from "@rue/types";
import { isFunction, isObject } from "@rue/utils";
import { addToSuspense, Suspense } from "./Suspense";
import { Ion, isIon, MutableIon } from "../ion/Ion";
import { instantUpdate } from "../reactivity/Update";
import { toPromise } from "./AsyncIon";

// TODO: races
// suspense

// export let oo: { await<T>(dispatch: () => Promise<T>, onFulfilled?: (result: T) => unknown): Promise<void> } = { await() { } }

// type DispatchAction<F extends (...args: any[]) => any> = ((...args: Parameters<F>) => Resolved<ReturnType<F>>) & { pending: Promise<unknown> | null, error: Error | null, retry(): void }

type Ions<V> = V extends { [key: PropertyKey]: any } ? { [K in keyof V]: MutableIon<V[K]> } : MutableIon<V>

export const REFETCH = Symbol('refetch')

const cancelledPromises = new Set()

function cancelPromise(promise: Promise<any> | AsyncSeries) {
   if ('cancel' in promise) promise.cancel()
   else cancelledPromises.add(promise)
}

function isCancelled(promise: Promise<any> | AsyncSeries) {
   if ('cancelled' in promise) return promise.cancelled
   return cancelledPromises.has(promise)
}

export function Action<F, V>(dispatch: F & ((...args: any[]) => AsyncNode<V> | Promise<V>), options: { target: Ions<V>, '-suspense'?: Suspense }): ((...args: F extends (...args: infer P) => any ? P : never) => F extends (...args: any[]) => infer R ? R extends AsyncNode<infer V> ? Promise<V> : never : never) & { pending: Promise<unknown> | null, error: Error | null, retry(): void } {
   const target = options.target
   const ions = (isIon(target) ? undefined : target) as AnyObject
   const ionKeys = ions ? ions instanceof Array ? Array.from(ions.keys()) : Object.keys(ions) : undefined
   let resolve: ((value: any | PromiseLike<any>) => void) | null;
   let reject: ((reason?: any) => void) | null
   const $promise = Ion(null as Promise<unknown> | null)
   const $error = Ion(null)
   let retry: undefined | (() => void); // TODO:

   let pendingPromise: AsyncSeries | Promise<any> | null = null

   function cancelIfFetching() {
      if (pendingPromise) {
         cancelPromise(pendingPromise)
         console.warn('CANCEL FETCH')
         pendingPromise = null
         return true
      }
      return false
   }

   const quark = { $promise, $error, cancelIfFetching }

   const suspense = options?.['-suspense']
   if (suspense) addToSuspense(suspense, quark)

   function dispatchAction(...args: any[]) {
      cancelIfFetching()
      if (!resolve) {
         $promise.value = new Promise((res, rej) => { resolve = res; reject = rej })
         if (!suspense) {
            $promise.value.catch(err => {
               if (err === 'cancelled') return;
               else throw err
            })
         }
      }
      const asyncNode = dispatch(...args)
      const promise = pendingPromise = INTERNAL in asyncNode ? asyncNode[INTERNAL].series : asyncNode
      const output = toPromise(asyncNode)
      output
         .then((value: any) => {
            if (isCancelled(promise)) {
               cancelledPromises.delete(promise)
               if (reject) {
                  reject('cancelled')
                  resolve = null
                  reject = null
               }
               return;
            }
            // if (cancelledPromises.has(output)) {
            //    cancelledPromises.delete(output)
            //    console.log('cancel value', value)
            //    if (reject) {
            //       reject('cancelled')
            //       resolve = null
            //       reject = null
            //    }
            //    return;
            // }
            pendingPromise = null
            console.log('resolve to:', value)
            if (resolve) {
               resolve(value)
               resolve = null
               reject = null
            }
            instantUpdate(() => {
               const updateIon = (ion: MutableIon<any>, value: any) => {
                  if (value === REFETCH) {
                     console.log('refetch :)')
                     if (!('refetch' in ion) || !isFunction(ion.refetch)) {
                        console.log('refetch :(')
                        if (__DEV__) throw new Error('Refetch failed. Refetch method required in order to refetch')
                     }
                     else {
                        ion.refetch()
                     }
                  }
                  else ion.value = value
               }

               if (ionKeys) {
                  console.log('ionKeys', ionKeys)
                  for (const key of ionKeys) {
                     if (isObject(value) && key in value) {
                        updateIon(ions[key], value[key])
                     }
                     else if (__DEV__) {
                        throw new Error('The keys of Action return type must match keys of toBeMutated argument')
                     }
                  }
               }
               else {
                  updateIon(target as MutableIon<any>, value)
               }

               $promise.value = null
            })
         })
         .catch((err: any) => {
            pendingPromise = null
            if (reject) {
               reject(err)
               resolve = null
               reject = null
            }
            instantUpdate(() => {
               $promise.value = null
               // $error.value = err
            })
            throw err
         })






      // if (!resolve) {
      //    $promise.value = new Promise((res, rej) => { resolve = res; reject = rej })
      //    if (!options?.suspense) {
      //       $promise.value.catch(err => {
      //          if (err === 'cancelled') return;
      //          else throw err
      //       })
      //    }
      // }

      // output
      //    .then(value => {

      //       // if (cancelledPromises.has(output)) {
      //       //    cancelledPromises.delete(output)
      //       //    console.log('cancel value', value)
      //       //    if (reject) {
      //       //       reject('cancelled')
      //       //       resolve = null
      //       //       reject = null
      //       //    }
      //       //    return;
      //       // }
      //       // pendingPromise = null
      //       // console.log('resolve to:', value)
      //       // if (resolve) {
      //       //    resolve(value)
      //       //    resolve = null
      //       //    reject = null
      //       // }
      //       instantUpdate(() => {
      //          // onSettled(value)
      //          $promise.value = null
      //       })
      //    })
      //    .catch(err => {
      //       // pendingPromise = null
      //       if (reject) {
      //          reject(err)
      //          resolve = null
      //          reject = null
      //       }
      //       instantUpdate(() => {
      //          $promise.value = null
      //       })
      //       if (err === 'cancelled') return;
      //       else throw err;
      //    })
      return output
   }

   Object.defineProperties(dispatchAction, {
      pending: { get: () => $promise() },
      error: { get: () => $error() },
      retry: { value: () => retry?.() },
   })


   return dispatchAction as any
}