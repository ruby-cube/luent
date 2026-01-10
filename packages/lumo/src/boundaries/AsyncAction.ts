import { Ion, queueTask, swiftUpdate } from "@rue/quarky";
import { Suspense, SUSPENSE_QUARK } from "./Suspense";

// TODO: races
// suspense

export function AsyncAction<F extends (...args: any[]) => Promise<unknown>>(dispatch: F, options?: { suspense: Suspense }): F & { pending: Promise<unknown> | null, error: Error | null, retry(): void } {
   let resolve: ((value: T | PromiseLike<T>) => void) | null;
   let reject: ((reason?: any) => void) | null
   const $promise = Ion(null as Promise<unknown> | null)
   const $error = Ion(null)
   let retry: undefined | (() => void); // TODO:

   const pendingPromises: Set<Promise<unknown>> = new Set()

   function isFetching() {
      return Boolean(pendingPromises.size)
   }

   function cancelFetch() {
      console.warn('CANCEL FETCH', pendingPromises.size, cancelledPromises.size)
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

   options?.suspense?.[SUSPENSE_QUARK].start(quark)

   const cancelledPromises = new Set()
   function dispatchAction(...args: any[]) {
      
      cancelIfFetching()
      const output = dispatch(...args)
      pendingPromises.add(output)

      if (!resolve) {
         $promise.value = new Promise((res, rej) => { resolve = res; reject = rej })
         if (!options?.suspense) {
            $promise.value.catch(err => {
               if (err === 'cancelled') return;
               else throw err
            })
         }
      }

      output
         .then(value => {
            pendingPromises.delete(output)

            if (cancelledPromises.has(output)) {
               cancelledPromises.delete(output)
               if (reject) {
                  reject('cancelled')
                  resolve = null
                  reject = null
               }
               swiftUpdate(() =>
                  $promise.value = $promise()
               )
               return;
            }
            if (resolve) {
               // console.log('resolve')
               resolve(value)
               resolve = null
               reject = null
            }
            swiftUpdate(() => {
               $promise.value = null
            })
         })
         .catch(err => {
            pendingPromises.delete(output)
            if (reject) {
               reject(err)
               resolve = null
               reject = null
            }
            swiftUpdate(() => {
               $promise.value = null
            })
            if (err === 'cancelled') return;
            else throw err;
         })
      return output
   }

   Object.defineProperties(dispatchAction, {
      pending: { get: () => $promise() },
      error: { get: () => $error() },
      retry: { value: () => retry?.() },
   })


   return dispatchAction as F & { pending: Promise<unknown> | null, error: Error | null, retry(): void }
}