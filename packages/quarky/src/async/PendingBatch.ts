import { getActiveFlask } from "@luent/flask";
import { createAtomicIon } from "../ion/AtomicIon";
import { createMemoizedDerivation } from "../ion/DerivationIon";
import { Ion, MutableIon } from "../ion/Ion";
import { AsyncQuark } from "./AsyncIon";
import { awaitsPrelude } from "../reactivity/IonicTask";

const PENDING_BATCH = Symbol('pending batch quark')

export type $PendingBatch = Ion<Promise<void>> & { [PENDING_BATCH]: PendingBatchQuark }

type PendingBatchQuark = {
  include(quark: AsyncQuark): void
  quarkCount: number
} & AsyncQuark

export function $PendingBatch(): $PendingBatch {
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
    for (const { $resolved } of quarks) {
      if ($resolved()) return true;
    }
    return false;
  }) as Ion<boolean>

  const cancelIfFetching = () => {
    let success = false
    for (const { cancelIfFetching, $promise } of quarks) {
      const cancelled = success = cancelIfFetching()
      if (cancelled) unresolved.delete($promise()) // TODO: not sure if this is correct...
    }
    return success
  }

  const $error = createMemoizedDerivation(() => {
    for (const { $error } of quarks) {
      const error = $error()
      if (error) return error;
    }
    return null;
  }) as Ion<Error | null>


  // Performance
  let startTime = performance.now();
  function timecheck() {
    const delta = performance.now() - startTime
    if (__INTERNAL__) console.log('Suspense: suspense took', delta)
  }

  // Pending batch ion
  const $pending = createAtomicIon(Pending()) as MutableIon<Promise<void>>

  const $pendingBatch = createMemoizedDerivation(() => {
    return $pending()
  }, {
    [PENDING_BATCH]: ({
      $error,
      $loaded,
      $promise: () => $pending(),
      $resolved,
      cancelIfFetching,
      include,
      get quarkCount() {
        return quarks.size
      },
    }) satisfies PendingBatchQuark
  }) as unknown as $PendingBatch

  function include(quark: AsyncQuark) {
    if (import.meta.env.SSR) return;
    if (quarks.has(quark)) return;
    quarks.add(quark)

    getActiveFlask().onDiscard(() => {
      if (quark.cancelIfFetching()) unresolved.delete(quark.$promise())
      quarks.delete(quark)
    })

    let previous: Promise<unknown>

    awaitsPrelude((oo, initial) => {
      const promise = quark.$promise();
      const resolved = oo(quark.$resolved)
      if (!initial && promise === previous) {
        return;
      }
      unresolved.delete(previous)
      previous = promise
      if (resolved) {
        if (unresolved.size === 0 && $resolved()) {
          if (resolve) {
            timecheck()
            resolve()
            resolve = null
            reject = null
          }
        }
        return;
      }

      unresolved.add(promise)
      if (!resolved) {
        startTime = performance.now()
        $pending.value = new Promise<void>((res, rej) => { resolve = res; reject = rej });
      }

      promise
        .catch(err => {
          unresolved.delete(promise)
          if (err === 'cancelled') {
            return;
          }
          if (reject) {
            reject(err)
            resolve = null
            reject = null
          }
        })
    })

  }

  return $pendingBatch
}