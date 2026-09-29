import { As } from "../conditional/As"
import { createIfSeries, If } from "../conditional/If"
import { Ion, ion, SuspenseIon, awaitsPrelude, $Async, Observer, tick, addToSuspense, ASYNC_QUARK, pushAwaiting, popAwaiting, getAwaiting } from "@luent/quarky"

export function Awaits<T>(promise: Promise<T> | Ion<Promise<T>> | Ion<T> & $Async<T>, render: (result: T) => any) {
  console.log('AWAITS')
  const fetch = 'then' in promise ? () => promise : ASYNC_QUARK in promise ? (oo: Observer) => {
    /* oo(promise[ASYNC_QUARK].$pending);  */return oo(() => promise.promised)
  } : (oo: Observer) => oo(promise)

  const $loaded = ion(false as Promise<any> | false)
  const $result = ion(undefined as T, {
    '-fetch': fetch,
    '-awaited': false
  })

  awaitsPrelude(oo => {
    const promise = fetch(oo);
    if (!promise) return;
    console.log('current', promise)
    promise.then(() => {
      console.log('AWAITS LOADED')
      $count.value++;
      $loaded.value = promise
    }).catch(error => {
      console.log('suppressed error', error)
      // if (error === 'cancelled') return;
      // else throw error
    })
  })

  // const $suspense = SuspenseIon()

  const $count = ion(0)

  if (typeof promise === 'function') {
    return <>
      {As($loaded, () => {
        const output = render($result() as T)
        console.log('RENDER AS!', output)
        return output
      })}
    </>
    // return {
    //   $suspense,
    //   renderResolved: () => {
    //     try {
    //       console.log('RENDER RESOLVED AWAITS')
    //       // pushAwaiting($suspense)
    //       return <>
    //         {As($loaded, () => {
    //           const output = render($result() as T)
    //           console.log('RENDER AS!', output)
    //           return output
    //         })}
    //       </>
    //     }
    //     finally {
    //       // popAwaiting()
    //     }
    //   }
    // }
  }

  return createIfSeries([
    If($loaded, () => render($result() as T))
  ])

  // return {
  //   $suspense,
  //   renderResolved: () => {
  //     try {
  //       // pushAwaiting($suspense)
  //       return createIfSeries([
  //         If($loaded, () => render($result() as T))
  //       ])
  //     } finally {
  //       // popAwaiting()
  //     }
  //   }
  // }
}