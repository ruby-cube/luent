import { getActiveFlask } from "@rue/flask"
import { PRELUDE } from "../reactivity/RenderCycle"
import { instantUpdate } from "../reactivity/Update"
import { watch } from "../reactivity/Watcher"
import { Ion } from "../ion/Ion"
import { AsyncQuark } from "./AsyncIon"

export type Suspense = Ion<Promise<void> | null> & {
   initial: boolean
   oo: Promise<unknown> | null
   await(): void
   retry(): void
   pendingState: any
   [SUSPENSE_QUARK]: SuspenseQuark
}

type SuspenseQuark = {
   start(quark: AsyncQuark): void
   quarkCount: number
} & AsyncQuark

const SUSPENSE_QUARK = Symbol('suspense quark')



export function addToSuspense(suspense: Suspense, quark: AsyncQuark) {
   suspense[SUSPENSE_QUARK].start(quark)
}

export function getSuspenseCount(suspense: Suspense) {
   return suspense[SUSPENSE_QUARK].quarkCount
}


export function Suspense<P>(pendingState?: P): Suspense {
   const quarks = new Set<AsyncQuark>()
   let resolve: (() => void) | null
   let reject: ((reason?: any) => void) | null
   const $pendingState = Ion(pendingState)

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
      console.log('Suspense: suspense took', delta)
   }

   const $suspense = Ion(null as Promise<unknown> | null, {
      initial: true,
      get oo(): Promise<unknown> | null {
         return $suspense()
      },
      await() {
         return $suspense()
      },
      retry() {
         console.warn('NOT YET IMPLEMENTED')
      },
      get pendingState(): P {
         return $pendingState() as P
      },
      set pendingState(value: P) {
         $pendingState.value = value
      },
      [SUSPENSE_QUARK]: {
         get $promise(): Ion<Promise<unknown> | null> {
            return $suspense
         },
         get quarkCount() {
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
               console.log('Suspense: ++ new promise')
               $suspense.value = new Promise<void>((res, rej) => { resolve = res; reject = rej });
               startTime = performance.now()
            }
            console.log('Suspense: starting suspense', $promise())
            quarks.add(quark)
            getActiveFlask().onDiscard(() => {
               if (quark.cancelIfFetching()) pendingPromises.delete($promise())
               console.log('Suspense: discarding quark')
               quarks.delete(quark)
            })

            watch($promise, ({ current: promise, previous, eager }) => {
               console.log('SUSPENSE: promise:', promise, 'prev:', previous)
               if (!eager && promise === previous) {
                  console.log('Suspense: same', promise)
                  return;
               }
               pendingPromises.delete(previous)
               if (promise === null) {
                  if (!$suspense()) console.warn("Suspense: should be impossible. $suspense is null while promise turned null", previous)
                  if (!pendingPromises.has(previous)) console.warn('Suspense: previous not in pending promises', previous)
                  console.log('Suspense: promise null, pending promises:', pendingPromises.size, previous)
                  if (pendingPromises.size === 0 && !isPending()) {
                     if (resolve) {
                        timecheck()
                        resolve()
                        resolve = null
                        reject = null
                     }
                     console.log('Suspense RESOLVED: Suspense to NULL :D', $suspense.value)
                     $suspense.value = null
                     if ($suspense.initial) $suspense.initial = false
                  }
                  return;
               }

               pendingPromises.add(promise)
               console.log('Suspense: +promise; pending promises:', pendingPromises.size)
               if ($suspense.initial) $suspense.initial = false
               if (!$suspense()) {
                  startTime = performance.now()
                  console.log('Suspense: ++ new suspense promise')
                  $suspense.value = new Promise<void>((res, rej) => { resolve = res; reject = rej });
               }

               promise
                  .catch(err => {
                     pendingPromises.delete(promise)
                     if (err === 'cancelled') {
                        console.log('Suspense: catch canceled; delete promise', pendingPromises.size)
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