import { observe } from "../reactivity/Observer"
import { AnyObject } from "@luently/types"
import { MutableIon } from "../ion/Ion"
import { createAtomicIon } from "../ion/AtomicIon"
import { createMemoizedDerivation } from "../ion/DerivationIon"
import { PRELUDE, SYNC } from "../reactivity/RenderCycle"

type AsyncDerivationConfig<T = any> = {
   standin?: T,
   fetch: (prev: any) => any,
   changed?: (a: T, b: T) => boolean,
   awaited?: boolean
}

// TODO: Traceablility
// [X] pending
// [X] loaded
// [X] erred
// [] Await()
// [] Suspense 
// [] retry
// [] refetch
// [] canceling previous


export function createAsyncDerivation(config: AsyncDerivationConfig, setup?: AnyObject) {
   const { fetch, standin } = config
   // const previous = new SimpleState(standin)
   const cancelledPromises = new Set<Promise<unknown>>()

   const $loaded = createAtomicIon(false)
   const $error = createAtomicIon(undefined)
   const $pending = createAtomicIon(true) as MutableIon<true | Promise<unknown> | null>;

   const $fetch = createMemoizedDerivation(fetch)

   observe($fetch, setAsyncState, { phase: PRELUDE, eager: true })

   function setAsyncState() {
      const pendingPromise = $pending?.()
      const output = $fetch()
      if (output === pendingPromise) return;
      if (pendingPromise instanceof Promise) {
         cancelledPromises.add(pendingPromise)
      }
      if (output instanceof Promise) {
         $pending!.value = output
         output
            .then(res => {
               if (cancelledPromises.has(output)) {
                  cancelledPromises.delete(output)
                  return; // TODO: throw error?
               }
               if (!$loaded()) $loaded.value = true;
               $state.value = res
               $pending!.value = null
               $error.value = null
            })
            .catch(error => {
               $error.value = error
               $pending!.value = null
            })
         $state.value = standin
      }
      else {
         $pending.value = null
         $state.value = output;
      }
   }

   const $state = createAtomicIon(standin, {
      devName: setup?.devName,
      get pending() {
         return $pending?.()
      },
      get loaded() {
         return $loaded()
      },
      get erred() {
         return $error()
      },
      refresh() {
         setAsyncState()
      }
   })

   return $state
}