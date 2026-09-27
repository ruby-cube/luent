import { As } from "../conditional/As"
import { createIfSeries, If } from "../conditional/If"
import { Ion, ion, SuspenseIon, awaitsPrelude, $Async, Observer, $PendingBatch, tick } from "@luent/quarky"

export function Awaits<T>(promise: Promise<T> | Ion<Promise<T>> | Ion<T> & $Async<T>, render: (result: T) => any) {
  console.log('AWAITS')
  const fetch = 'then' in promise ? () => promise : 'pending' in promise ? (oo: Observer) => {
    oo(() => promise.resolved); return promise.pending
  } : (oo: Observer) => oo(promise)

  const $loaded = ion(false as Promise<any> | false)
  const $result = ion(undefined as T, {
    '-fetch': fetch,
    // 'awaited': false
  })

  // observe(fetch, ({ current }) => {
  //   if (!current) return;
  //   console.log('current', current)
  //   current.then(() => {
  //     $loaded.value = current
  //   }).catch(error => {
  //     if (error === 'cancelled') return;
  //     else throw error
  //   })
  // }, { phase: PRELUDE, eager: true })

  awaitsPrelude(oo => {
    const promise = fetch(oo)
    console.log('current', promise)
    promise.then(() => {
      console.log('AWAITS LOADED')
      $loaded.value = promise
    }).catch(error => {
      if (error === 'cancelled') return;
      else throw error
    })
  })

  const $suspense = SuspenseIon()



  if (typeof promise === 'function') {
    return {
      $suspense,
      renderResolved: () => {
        console.log('RENDER RESOLVED')
        return <>
          {As($loaded, () => {
            console.log('RENDER AWAITS', $result())
            return render($result() as T)
          })}
        </>
      }
    }
  }

  return {
    $suspense,
    renderResolved: () => {
      console.log('RENDER AWAITS')
      return createIfSeries([
        If($loaded, () => () => render($result() as T))
      ])
    }
  }
}