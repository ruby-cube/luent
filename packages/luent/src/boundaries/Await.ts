// {Await(($file = fetchFile($userID, $fileID)) =>
//    <File id={$fileID()} file={$file} />
// )}
// {Meanwhile({ timeout: 500 },
//    <Loading />
// )}
// {Catch(err =>
//    <div>{err}</div>
// )}

import { ASYNC_QUARK, AsyncIon, isAsyncIon, popAwaiting, pushAwaiting, SuspenseIon, SUSPENSE_QUARK, AsyncQuark, createAtomicIon, ion, Ion, isIon, MutableIon, PRELUDE, observe, awaitsPrelude, getAwaiting, SYNC } from "@luent/quarky";
import { RawJSXNode, RenderFunction } from "../node/makeJSXNode";
import { RenderError } from "./Try";
import { createIfSeries, Else, ElseIf, If } from "../conditional/If";
import { isFunction, normalizeToArray, toError, UNDEFINED } from "@luent/utils";

// export function Suspense(input: FromTag<AwaitConfig>) {
//    const { await: _awaited, $as: suspense, provide, meanwhile: renderPlaceholder, catch: renderError, loading: renderLoading, Slot } = input
//    // TODO: renderLoading
//    const $suspense = suspense ?? SuspenseIon()
//    const renderSlot = collectAwaited($suspense, _awaited, Slot)
//    return template(
//       createAwaitSeries(renderSlot, renderPlaceholder ? wrapWithSuspense(renderPlaceholder, $suspense) : undefined, renderError, $suspense)
//    )
// }



type RenderAsync = (suspense: SuspenseIon) => RawJSXNode

type AwaitKit = {
  $suspense: SuspenseIon,
  // ions: (AsyncIon<unknown> | SuspenseIon)[];
  renderResolved: RenderFunction;
}

type MeanwhileKit = {
  timeout: number | undefined;
  renderPlaceholder: RenderFunction;
}



// export function Await(suspense: [...any[], RenderFunction | RawJSXNode]): AwaitKit
// export function Await(renderResolved: RenderFunction | RawJSXNode): AwaitKit
// export function Await(suspense: any | any[], renderResolved: RenderFunction | RawJSXNode): AwaitKit
// export function Await(renderOrSuspense: [...any[], RenderFunction | RawJSXNode] | RenderFunction | any | any[], renderResolved?: RenderFunction | RawJSXNode): AwaitKit {
export function Await(...awaited: [...any[], RawJSXNode | (($suspense: SuspenseIon) => any | RawJSXNode)]): AwaitKit {
  const renderResolved = awaited.at(-1)
  if (!isFunction(renderResolved) || isIon(renderResolved)) throw new Error('INVALID Render function')
  const secondToLast = awaited.at(-2)
  const $suspense = secondToLast instanceof Object && SUSPENSE_QUARK in secondToLast ? secondToLast as SuspenseIon : SuspenseIon()
  if (import.meta.env.SSR) return {
    $suspense,
    // ions,
    renderResolved: () => undefined,
  }

  const render = collectAwaited($suspense, awaited, renderResolved)

  function collectAwaited($suspense: SuspenseIon, awaited: any[], Slot: RenderFunction) {
    let output: RawJSXNode;
    // let awaitsSlot = false;
    const awaitables = normalizeToArray(awaited)
    if (awaitables.length === 0) awaitables.push(true)
    for (const awaitable of awaitables) {
      if (awaitable === $suspense) {
        continue;
      }
      else if (awaitable === Slot) {
        // awaitsSlot = true;
        try {
          pushAwaiting($suspense)
          output = Slot({
            ifPending<T, U>(suspense: T, value?: U) {
              return $suspense() ? suspense : value
            },
            $promised: $suspense[SUSPENSE_QUARK].$promise,
            $suspense
          })
        }
        finally {
          console.log('QUARKS!!', $suspense[SUSPENSE_QUARK].quarkCount)
          popAwaiting()
        }
      }
      else if (isAsyncIon(awaitable)) {
        $suspense[SUSPENSE_QUARK].include(awaitable[ASYNC_QUARK])
      }
      else if (awaitable instanceof Promise) {
        $suspense[SUSPENSE_QUARK].include(AsyncIon(() => awaitable)[ASYNC_QUARK])
      }
    }
    return () => output
  }

  return {
    $suspense,
    // ions,
    renderResolved: render,
  }
}

export function _Meanwhile(renderPlaceholder: ((o: SuspenseIon) => RawJSXNode) | RawJSXNode): MeanwhileKit
export function _Meanwhile(options: { timeout: number }): MeanwhileKit
export function _Meanwhile(renderOrOptions: ((o: SuspenseIon) => RawJSXNode) | RawJSXNode | { timeout: number }, renderPlaceholder?: ((o: SuspenseIon) => RawJSXNode) | RawJSXNode | RawJSXNode): MeanwhileKit {
  const timeout = renderPlaceholder ? (<{ timeout: number }>renderOrOptions).timeout : undefined
  const render = (renderPlaceholder ? renderPlaceholder : renderOrOptions) as RenderFunction
  return {
    renderPlaceholder: render,
    timeout
  }
}

export function Meanwhile(renderPlaceholder: any) {
  return _Meanwhile(o => {
    return o.initial && renderPlaceholder()
  })
}

export function Twiddle(renderPlaceholder: any) {
  return _Meanwhile(o => {
    return !o.initial && renderPlaceholder()
  })
}

// const getAwaitStack = defineAppwide('awaitStack', () => [] as { promises: Promise<any>[], $promises: Ion<Promise<unknown> | null>[] }[])

// function $awaitStack() {
//    const awaitStack = getAwaitStack()
//    if (awaitStack.length === 0) // awaitStack has not been initialized by Await()
//       throw new Error('pend must be handled by an Await call in a parent or ancestor component');
//    return awaitStack
// }

// export function pend(promiseValue: Promise<any> | Promise<any>[]) {
//    const awaitStack = $awaitStack()
//    const promise =
//       promiseValue instanceof Array
//          ? Promise.all(promiseValue)
//          : promiseValue

//    const { promises } = awaitStack.at(-1)!;
//    promises.push(promise)
//    return promise;
// }

// export function pendReload($promise: Ion<Promise<unknown> | null>) {
//    const awaitStack = $awaitStack()
//    const { $promises } = awaitStack.at(-1)!;
//    $promises.push($promise)
//    return ion;
// }

export function unpackAwaitSeries(series:
  [AwaitKit]
  | [AwaitKit, { renderError: RenderError }]
  | [AwaitKit, { renderPlaceholder: RenderFunction, timeout?: number }]
  | [AwaitKit, { renderPlaceholder: RenderFunction, timeout?: number }, { renderError: RenderError }]
) {
  const awaitKit = series[0]
  const { $suspense, renderResolved } = awaitKit;
  const secondKit = series[1]
  const thirdKit = series[2]
  const renderPlaceholder = secondKit && 'renderPlaceholder' in secondKit ? $suspense ? wrapWithSuspense(secondKit.renderPlaceholder, $suspense) : secondKit.renderPlaceholder : (() => undefined);
  const renderError = secondKit && 'renderError' in secondKit ? secondKit.renderError : thirdKit?.renderError;
  const timeout = secondKit && 'timeout' in secondKit ? secondKit.timeout : undefined

  return {
    $suspense,
    renderResolved,
    renderPlaceholder,
    renderError,
    timeout
  }
}


function wrapWithSuspense(render: RenderFunction, $suspense: SuspenseIon) {
  return () => {
    try {
      pushAwaiting($suspense!)

      return render($suspense)
    }
    finally {
      popAwaiting()
    }
  }
}



// if (arguments.length === 1) {
//    $suspense = Suspense()
//    ions.push($suspense)
//    // console.log('IONS', ions)
//    let output: RawJSXNode;
//    try {
//       pushAwaiting($suspense)
//       output = render($suspense)
//    }
//    finally {
//       popAwaiting()
//       render = () => { return output }
//    }
// }
// else {
//    $suspense = { get initial() { return !ions[0].loaded } } // TODO: makeshift solution for nonce
// }

// type Awaitable = AsyncIon<any> | Promise<any> | Ion<Promise<any>> | 'view'

// export type AwaitConfig = {
//    await?: true | Awaitable | Awaitable[]
//    as?: SuspenseIon
//    meanwhile?: (suspense: SuspenseIon) => RawJSXNode | false
//    loading?: (suspense: SuspenseIon) => RawJSXNode | false
//    catch?: (error: Error) => RawJSXNode,
//    Slot: RenderTag
// }

// export function wrapWithAwait(Slot: RenderFunction, config: AwaitConfig) {
//    const { await: _awaited, as: suspense, meanwhile: renderPlaceholder, catch: renderError, loading } = config
//    const $suspense = suspense ?? SuspenseIon()
//    console.log('wrap with await')
//    const renderSlot = collectAwaited($suspense, _awaited, Slot)
//    return () => {
//       return createAwaitSeries(renderSlot, renderPlaceholder ? wrapWithSuspense(renderPlaceholder, $suspense) : undefined, renderError, $suspense)
//    }
// }

// ion(0, {
//    '-awaited': true
// })


// function collectAwaited($suspense: SuspenseIon, awaited: true | Awaitable | Awaitable[] | undefined, Slot: RenderFunction) {
//    let output: RawJSXNode;
//    let awaitsSlot = false;
//    const awaitables = normalizeToArray(awaited)
//    if (awaitables.length === 0) awaitables.push(true)
//    for (const awaitable of awaitables) {
//       if (awaitable === true || awaitable === 'view') {
//          awaitsSlot = true;
//          try {
//             pushAwaiting($suspense)
//             output = Slot($suspense)
//          }
//          finally {
//             popAwaiting()
//          }
//       }
//       else if (isAsyncIon(awaitable)) {
//          $suspense[SUSPENSE_QUARK].include(awaitable[ASYNC_QUARK])
//       }
//       else if (awaitable instanceof Promise) {
//          $suspense[SUSPENSE_QUARK].include(AsyncIon(() => awaitable)[ASYNC_QUARK])
//       }
//    }
//    return awaitsSlot ? () => output : Slot
// }


export function createAwaitSeries(
  // renderResolved: RenderFunction,
  // renderPlaceholder: RenderFunction = () => false,
  // renderError: RenderError | undefined = () => undefined,
  // $suspense: SuspenseIon


  series:
    [AwaitKit]
    | [AwaitKit, { renderError: RenderError }]
    | [AwaitKit, { renderPlaceholder: RenderFunction, timeout?: number }]
    | [AwaitKit, { renderPlaceholder: RenderFunction, timeout?: number }, { renderError: RenderError }]
) {
  const { renderError, renderPlaceholder, renderResolved, $suspense } = unpackAwaitSeries(series)
  if (import.meta.env.SSR) return renderPlaceholder()
  const $error = $suspense[SUSPENSE_QUARK].$error
  const $loaded = $suspense[SUSPENSE_QUARK].$loaded

  const outerView = getAwaiting()
  const outerSuspense = outerView?.[SUSPENSE_QUARK]

  if (outerSuspense) {
    observe($error, ({ current: error }) => {
      if (error === null || outerSuspense.$loaded()) return;
      outerSuspense.setError(error)
    }, { phase: SYNC })
  }

  return createIfSeries([
    If(() => !outerView || outerSuspense.$loaded(),
      createIfSeries([
        If(() => $loaded() || !renderError && $error(), () => {
          return renderResolved()
        }),
        ElseIf(() => renderError && $error(), () => {
          return renderError!($error()!)
        }),
        Else(renderPlaceholder),
      ])
    )
  ])
}

//@ts-expect-error
globalThis._$$AwaitSeries = createAwaitSeries

