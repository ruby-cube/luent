import { As } from "../conditional/As"
import { createIfSeries, If } from "../conditional/If"
import { ASYNC_QUARK, AsyncQuark, Ion, ion, SUSPENSE_QUARK, SuspenseIon, observe } from "@luent/quarky"

export function Awaiting<T>(promise: Promise<T> | Ion<Promise<T> | null>, render: (result: T) => any) {

  const $result = ion(undefined as T, {
    '-fetch': typeof promise === 'function' ? promise : () => promise
  })
  const $suspense = SuspenseIon()
  $suspense[SUSPENSE_QUARK].include(($result as any)[ASYNC_QUARK] as AsyncQuark)

  const $loaded = ion(false as Promise<any> | false | undefined | null)

  observe($suspense, ({ previous }) => {
    if ($suspense() === null) {
      $loaded.value = previous;
    }
  })

  if (typeof promise === 'function') {
    return {
      $suspense,
      renderResolved: () => {
        return <>
          {As($loaded, () => render($result() as T))}
        </>
      }
    }
  }

  return {
    $suspense,
    renderResolved: () => {
      return createIfSeries([
        If($loaded, () => render($result() as T))
      ])
    }
  }
}