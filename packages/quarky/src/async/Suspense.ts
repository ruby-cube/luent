import { getActiveFlask } from "@luent/flask"
import { observe } from "../reactivity/Observer"
import { Ion } from "../ion/Ion"
import { AsyncQuark } from "./AsyncIon"
import { PRELUDE } from "../reactivity/RenderCycle"
import { createAtomicIon } from "../ion/AtomicIon"
import { awaitPrelude } from "../reactivity/IonicTask"

export type SuspenseIon = Ion<Promise<void> | null> & {
  initial: boolean
  oo: Promise<unknown> | null
  hold: any
  await(): void
  retry(): void
  pendingState: any
  [SUSPENSE_QUARK]: SuspenseQuark
}

type SuspenseQuark = {
  include(quark: AsyncQuark): void
  quarkCount: number
} & AsyncQuark

export const SUSPENSE_QUARK = Symbol('suspense quark')



export function addToSuspense(suspense: SuspenseIon, quark: AsyncQuark) {
  suspense[SUSPENSE_QUARK].include(quark)
}

export function getSuspenseCount(suspense: SuspenseIon) {
  return suspense[SUSPENSE_QUARK].quarkCount
}


export function SuspenseIon<P>(pendingState?: P): SuspenseIon {
  const quarks = new Set<AsyncQuark>()
  let resolve: (() => void) | null
  let reject: ((reason?: any) => void) | null
  const $pendingState = createAtomicIon(pendingState)

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
    if (__INTERNAL__) console.log('Suspense: suspense took', delta)
  }

  const $suspense = createAtomicIon(null as Promise<unknown> | null, {
    initial: true,
    get oo(): Promise<unknown> | null {
      return $suspense()
    },
    await() {
      return $suspense()
    },
    retry() {
      if (__DEV__) console.warn('.retry() method not yet implemented')
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
        let success = false
        for (const { cancelIfFetching, $promise } of quarks) {
          const cancelled = success = cancelIfFetching()
          if (cancelled) pendingPromises.delete($promise()) // TODO: not sure if this is correct...
        }
        return success
      },
      include(quark: AsyncQuark) {
        if (import.meta.env.SSR) return;
        if (quarks.has(quark)) return;
        // awaitPrelude(() => {
        const { $promise } = quark
        if ($promise() && !$suspense()) {
          $suspense.value = new Promise<void>((res, rej) => { resolve = res; reject = rej });
          startTime = performance.now()
        }
        // console.log('Suspense: starting suspense', $promise())
        quarks.add(quark)
        getActiveFlask().onDiscard(() => {
          if (quark.cancelIfFetching()) pendingPromises.delete($promise())
          // console.log('Suspense: discarding quark')
          quarks.delete(quark)
        })

        let previous: Promise<unknown> | null

        awaitPrelude((oo, initial) => {
          const promise = oo($promise);
          if (!initial && promise === previous) {
            return;
          }
          pendingPromises.delete(previous)
          previous = promise
          if (promise === null) {
            if (!$suspense() && __INTERNAL__) console.warn("Suspense: should be impossible. $suspense is null while promise turned null", previous)
            // console.log('Suspense: promise null, pending promises:', pendingPromises.size, previous)
            if (pendingPromises.size === 0 && !isPending()) {
              if (resolve) {
                timecheck()
                resolve()
                resolve = null
                reject = null
              }
              $suspense.value = null
              if ($suspense.initial) $suspense.initial = false
            }
            return;
          }

          pendingPromises.add(promise)
          // console.log('Suspense: +promise; pending promises:', pendingPromises.size)
          if ($suspense.initial) $suspense.initial = false
          if (!$suspense()) {
            startTime = performance.now()
            $suspense.value = new Promise<void>((res, rej) => { resolve = res; reject = rej });
          }

          promise
            .catch(err => {
              pendingPromises.delete(promise)
              if (err === 'cancelled') {
                return;
              }
              if (reject) {
                reject(err)
                resolve = null
                reject = null
              }
              // instantUpdate(() => {
              // $error.value = toError(err);
              $suspense.value = null
              // })
            })
        })

        // observe($promise, ({ current: promise, previous, eager }) => {
        //    if (!eager && promise === previous) {
        //       return;
        //    }
        //    pendingPromises.delete(previous)
        //    if (promise === null) {
        //       if (!$suspense() && __INTERNAL__) console.warn("Suspense: should be impossible. $suspense is null while promise turned null", previous)
        //       // console.log('Suspense: promise null, pending promises:', pendingPromises.size, previous)
        //       if (pendingPromises.size === 0 && !isPending()) {
        //          if (resolve) {
        //             timecheck()
        //             resolve()
        //             resolve = null
        //             reject = null
        //          }
        //          $suspense.value = null
        //          if ($suspense.initial) $suspense.initial = false
        //       }
        //       return;
        //    }

        //    pendingPromises.add(promise)
        //    // console.log('Suspense: +promise; pending promises:', pendingPromises.size)
        //    if ($suspense.initial) $suspense.initial = false
        //    if (!$suspense()) {
        //       startTime = performance.now()
        //       $suspense.value = new Promise<void>((res, rej) => { resolve = res; reject = rej });
        //    }

        //    promise
        //       .catch(err => {
        //          pendingPromises.delete(promise)
        //          if (err === 'cancelled') {
        //             return;
        //          }
        //          if (reject) {
        //             reject(err)
        //             resolve = null
        //             reject = null
        //          }
        //          // instantUpdate(() => {
        //             // $error.value = toError(err);
        //             $suspense.value = null
        //          // })
        //       })
        // }, { phase: PRELUDE, eager: true })
        // })
        return this
      }
    }
  })

  return $suspense
}