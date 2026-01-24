import { instantUpdate, Ion } from "@rue/quarky";
import { Suspense, SUSPENSE_QUARK } from "./Suspense";

// TODO: races
// suspense

export let oo: { await<T>(dispatch: () => Promise<T>, onFulfilled?: (result: T) => unknown): Promise<void> } = { await() { } }

export function AsyncAction<F extends (...args: any[]) => Promise<unknown>>(dispatch: F, options?: { suspense: Suspense }): F & { pending: Promise<unknown> | null, error: Error | null, retry(): void } {
   let resolve: ((value: any | PromiseLike<any>) => void) | null;
   let reject: ((reason?: any) => void) | null
   const $promise = Ion(null as Promise<unknown> | null)
   const $error = Ion(null)
   let retry: undefined | (() => void); // TODO:

   // const pendingPromises: Set<Promise<unknown>> = new Set()

   let pendingPromise: Promise<unknown> | null = null

   function isFetching() {
      return Boolean(pendingPromise)
   }

   function cancelFetch() {
      console.warn('CANCEL FETCH')
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

   const quark = { $promise, cancelIfFetching }

   options?.suspense?.[SUSPENSE_QUARK].start(quark)

   const cancelledPromises = new Set()
   function dispatchAction(...args: any[]) {
      oo = {
         await<T>(dispatch: () => Promise<T>, onFulfilled?: (result: T) => unknown) {
            const output = pendingPromise = dispatch()
            if (!resolve) {
               $promise.value = new Promise((res, rej) => { resolve = res; reject = rej })
               if (!options?.suspense) {
                  $promise.value.catch(err => {
                     if (err === 'cancelled') return;
                     else throw err
                  })
               }
            }
            return output
               .then(value => {

                  if (cancelledPromises.has(output)) {
                     cancelledPromises.delete(output)
                     console.log('cancel value', value)
                     if (reject) {
                        reject('cancelled')
                        resolve = null
                        reject = null
                     }
                     return;
                  }
                  pendingPromise = null
                  console.log('resolve to:', value)
                  if (resolve) {
                     resolve(value)
                     resolve = null
                     reject = null
                  }
                  instantUpdate(() => {
                     onFulfilled?.(value)
                     $promise.value = null
                  })
               })
               .catch(err => {
                  pendingPromise = null
                  if (reject) {
                     reject(err)
                     resolve = null
                     reject = null
                  }
                  instantUpdate(() => {
                     $promise.value = null
                  })

                  if (err === 'cancelled') return;
                  else throw err;
               })

         },
         then(arg) {

         },
         catch() {

         },
         finally() {

         }

      }


      cancelIfFetching()
      return dispatch(...args)

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