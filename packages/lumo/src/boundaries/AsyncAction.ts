import { instantUpdate, Ion } from "@rue/quarky";
import { Suspense, SUSPENSE_QUARK } from "./Suspense";
import { AsyncNode, AsyncSeries, INTERNAL } from "./ooo";

// TODO: races
// suspense

// export let oo: { await<T>(dispatch: () => Promise<T>, onFulfilled?: (result: T) => unknown): Promise<void> } = { await() { } }

export function AsyncAction<F extends (...args: any[]) => AsyncNode<unknown>>(dispatch: F, options?: { suspense: Suspense }): F & { pending: Promise<unknown> | null, error: Error | null, retry(): void } {
   let resolve: ((value: any | PromiseLike<any>) => void) | null;
   let reject: ((reason?: any) => void) | null
   const $promise = Ion(null as Promise<unknown> | null)
   const $error = Ion(null)
   let retry: undefined | (() => void); // TODO:

   let pendingSeries: AsyncSeries | null = null

   function cancelIfFetching() {
      if (pendingSeries){
         pendingSeries.cancel()
         console.warn('CANCEL FETCH')
         pendingSeries = null
         return true
      }
      return false
   }

   const quark = { $promise, cancelIfFetching }

   options?.suspense?.[SUSPENSE_QUARK].start(quark)

   function dispatchAction(...args: any[]) {
      cancelIfFetching()
      if (!resolve) {
         $promise.value = new Promise((res, rej) => { resolve = res; reject = rej })
         if (!options?.suspense) {
            $promise.value.catch(err => {
               if (err === 'cancelled') return;
               else throw err
            })
         }
      }
      const asyncNode = dispatch(...args)
      const series = pendingSeries = asyncNode[INTERNAL].series
      const output = asyncNode.asPromise
      output
         .then(value => {
            if (series.cancelled) {
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
            pendingSeries = null
            console.log('resolve to:', value)
            if (resolve) {
               resolve(value)
               resolve = null
               reject = null
            }
            instantUpdate(() => {
               $promise.value = null
            })
         })
         .catch(err => {
            pendingSeries = null
            if (reject) {
               reject(err)
               resolve = null
               reject = null
            }
            instantUpdate(() => {
               $promise.value = null
               // $error.value = err
            })
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
      // return output
   }

   Object.defineProperties(dispatchAction, {
      pending: { get: () => $promise() },
      error: { get: () => $error() },
      retry: { value: () => retry?.() },
   })


   return dispatchAction as F & { pending: Promise<unknown> | null, error: Error | null, retry(): void }
}