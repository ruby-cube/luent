import { getActiveFlask } from "@luent/flask"
import { Ion, MutableIon } from "../ion/Ion"
import { $Async, ASYNC_QUARK, AsyncIon, AsyncQuark, getAwaiting } from "./AsyncIon"
import { createAtomicIon } from "../ion/AtomicIon"
import { awaitsPrelude } from "../reactivity/IonicTask"
import { createMemoizedDerivation } from "../ion/DerivationIon"

export type SuspenseIon = Ion<Promise<void> | null> & {
  initial: boolean
  // await(): void
  // retry(): void
  [SUSPENSE_QUARK]: SuspenseQuark
}

type SuspenseQuark = {
  include(quark: AsyncQuark): void
  quarkCount: number
  resolve: () => void
} & AsyncQuark

export const SUSPENSE_QUARK = Symbol('suspense quark')



export function addToSuspense(suspense: SuspenseIon, quark: AsyncQuark) {
  suspense[SUSPENSE_QUARK].include(quark)
}

// export function $Pending(...args: any[]) {
//   const $pending = SuspenseIon()
//   for (const ion of args) {
//     addToSuspense($pending, ion[ASYNC_QUARK])
//   }
//   return () => {
//     const $awaiting = getAwaiting()
//     if ($awaiting) {
//       for (const ion of args) {
//         addToSuspense($awaiting, ion[ASYNC_QUARK])
//       }
//     }
//     return $pending()
//   }
// }

export function Promised(...args: any[]) {
  const $suspense = SuspenseIon()

  for (const ion of args) {
    addToSuspense($suspense, ion[ASYNC_QUARK])
  }

  return {
    ifPending<T, U>(suspense: T, value?: U) {
      return $suspense() ? suspense : value
    },
    $promised: $suspense[SUSPENSE_QUARK].$promise,
    $suspense: () => {
      const $awaiting = getAwaiting()
      if ($awaiting) {
        for (const ion of args) {
          addToSuspense($awaiting, ion[ASYNC_QUARK])
        }
      }
      return $suspense()
    }
  }
}

export function getSuspenseCount(suspense: SuspenseIon) {
  return suspense[SUSPENSE_QUARK].quarkCount
}


export function SuspenseIon<P>(): SuspenseIon {
  const quarks = new Set<AsyncQuark>()

  let resolve: (() => void) | null
  let reject: ((reason?: any) => void) | null

  function Pending() {
    return new Promise<void>((fulfill, rej) => {
      resolve = fulfill
      reject = rej
    })
  }

  const unresolved = new Set()

  const $loaded = createMemoizedDerivation(() => {
    for (const { $loaded } of quarks) {
      if ($loaded()) return true;
    }
    return false;
  }) as Ion<boolean>


  const $resolved = createMemoizedDerivation(() => {
    for (const { $pending } of quarks) {
      if ($pending()) return false
    }
    return true
  })

  const $error = createMemoizedDerivation(() => {
    for (const { $error } of quarks) {
      const error = $error()
      if (error) return error;
    }
    return null;
  }) as Ion<Error | null>

  const cancelIfFetching = () => {
    let success = false
    for (const { cancelIfFetching, $promise } of quarks) {
      const cancelled = success = cancelIfFetching()
      if (cancelled) unresolved.delete($promise()) // TODO: not sure if this is correct...
    }
    return success
  }

  // Performance check
  let startTime = performance.now();
  function timecheck() {
    const delta = performance.now() - startTime
    if (__INTERNAL__) console.log('Suspense: suspense took', delta)
  }

  const $promised = createAtomicIon(Pending()) as MutableIon<Promise<void> | null>

  const $suspense = createMemoizedDerivation(() => {
    return $promised()
  }, {
    initial: true,
    retry() {
      if (__DEV__) console.warn('.retry() method not yet implemented')
    },

    [SUSPENSE_QUARK]: {
      $promise: () => $promised(),
      $loaded,
      $error,
      $pending: () => !$resolved(),
      cancelIfFetching,
      include,
      resolve() {
        if (resolve) {
          timecheck()
          resolve()
          resolve = null
          reject = null
        }
        $promised.value = null
        if ($suspense.initial) $suspense.initial = false
      },
      get quarkCount() {
        return quarks.size
      }
    }
  }) as unknown as SuspenseIon



  function include(this: SuspenseIon, quark: AsyncQuark) {
    if (import.meta.env.SSR) return;
    if (quarks.has(quark)) return;
    quarks.add(quark)

    getActiveFlask().onDiscard(() => {
      if (quark.cancelIfFetching()) unresolved.delete(quark.$promise())
      quarks.delete(quark)
    })

    if (!$promised()) {
      $promised.value = Pending()
      startTime = performance.now()
    }

    let previous: Promise<unknown> | null
    let previousResolved: boolean | undefined

    awaitsPrelude((oo, initial) => {
      const promise = quark.$promise();
      const resolved = !oo(quark.$pending)

      if (!initial && promise === previous && resolved === previousResolved) {
        return;
      }

      unresolved.delete(previous)
      previous = promise
      previousResolved = resolved

      if (resolved) {
        if (unresolved.size === 0 && $resolved()) {
          if (resolve) {
            timecheck()
            resolve()
            resolve = null
            reject = null
          }
          $promised.value = null
          if ($suspense.initial) $suspense.initial = false
        }
        return;
      }

      if ($suspense.initial) $suspense.initial = false

      unresolved.add(promise)

      if (!$promised()) {
        startTime = performance.now()
        $promised.value = Pending()
      }

      promise
        .catch(err => {
          unresolved.clear()
          if (err === 'cancelled') {
            return;
          }
          if (reject) {
            reject(err)
            resolve = null
            reject = null
          }
          $promised.value = null
        })
    })
    return this
  }

  return $suspense
}