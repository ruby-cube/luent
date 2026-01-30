// {Await(($file = fetchFile($userID, $fileID)) =>
//    <File id={$fileID()} file={$file} />
// )}
// {Meanwhile({ timeout: 500 },
//    <Loading />
// )}
// {Catch(err =>
//    <div>{err}</div>
// )}

import { $_derivation, Ion, watch } from "@rue/quarky";
import { RawJSXNode, RenderFunction } from "../node/makeJSXNode";
import { RenderError } from "./Try";
import { createIfSeries, Else, ElseIf, If } from "../conditional/If";
import { createStack, normalizeToArray, toError, UNDEFINED } from "@rue/utils";
import { AsyncIon, popAwaiting, pushAwaiting } from "../../../quarky/src/async/AsyncIon";
import { INTERNAL_RENDER, POSTLUDE, PRELUDE, SYNC } from "../../../quarky/src/reactivity/RenderCycle";
import { AsyncState } from "@rue/flask";
import { Suspense } from "../../../quarky/src/async/Suspense";

type AwaitKit = {
   $suspense: Suspense | undefined,
   ions: (AsyncIon<unknown> | Suspense)[];
   renderResolved: RenderFunction;
}

type MeanwhileKit = {
   timeout: number | undefined;
   renderPlaceholder: RenderFunction;
}



export function Await(suspense: [...(AsyncIon<unknown> | Suspense)[], RenderFunction | RawJSXNode]): AwaitKit
export function Await(renderResolved: RenderFunction | RawJSXNode): AwaitKit
export function Await(suspense: AsyncIon<unknown> | Suspense | (AsyncIon<unknown> | Suspense)[], renderResolved: RenderFunction | RawJSXNode): AwaitKit
export function Await(renderOrSuspense: [...(AsyncIon<unknown> | Suspense)[], RenderFunction | RawJSXNode] | RenderFunction | RawJSXNode | AsyncIon<unknown> | Suspense | (AsyncIon<unknown> | Suspense)[], renderResolved?: RenderFunction | RawJSXNode): AwaitKit {
   const ions = (renderResolved ? normalizeToArray(renderOrSuspense) : []) as (AsyncIon<unknown> | Suspense)[];
   const _render = (renderResolved ? renderResolved : renderOrSuspense instanceof Array ? renderOrSuspense.pop() : renderOrSuspense) as RenderFunction;
   let render = _render;
   let $suspense;
   // TODO: renderResolved needs suspense if part of any array

   if (arguments.length === 1) {
      $suspense = Suspense()
      ions.push($suspense)
      // console.log('IONS', ions)
      let output: RawJSXNode;
      try {
         pushAwaiting($suspense)
         output = render($suspense)
      }
      finally {
         popAwaiting()
         render = () => output
      }
   }
   else {
      $suspense = { get initial() { return !ions[0].loaded } } // TODO: makeshift solution for nonce
   }

   return {
      $suspense,
      ions,
      renderResolved: render,
   }
}

export function Meanwhile(renderPlaceholder: RenderFunction | RawJSXNode): MeanwhileKit
export function Meanwhile(options: { timeout: number }): MeanwhileKit
export function Meanwhile(renderOrOptions: RenderFunction | RawJSXNode | { timeout: number }, renderPlaceholder?: RenderFunction | RawJSXNode): MeanwhileKit {
   const timeout = renderPlaceholder ? (<{ timeout: number }>renderOrOptions).timeout : undefined
   const render = (renderPlaceholder ? renderPlaceholder : renderOrOptions) as RenderFunction
   return {
      renderPlaceholder: render,
      timeout
   }
}

export function Nonce(renderPlaceholder: any) {
   console.log('Nonce')
   return Meanwhile(o => {
      console.log('o?', o)
      return o.initial ? renderPlaceholder() : undefined
   })
}

export function Catch(renderError: RenderError) {
   return {
      renderError
   }
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
   const { ions, $suspense, renderResolved } = awaitKit;
   const secondKit = series[1]
   const thirdKit = series[2]
   const renderPlaceholder = secondKit && 'renderPlaceholder' in secondKit ? $suspense ? wrapRenderPlaceholder(secondKit.renderPlaceholder) : secondKit.renderPlaceholder : (() => undefined);
   const renderError = secondKit && 'renderError' in secondKit ? secondKit.renderError : thirdKit?.renderError ?? (() => undefined);
   const timeout = secondKit && 'timeout' in secondKit ? secondKit.timeout : undefined
   console.log('wrap placeholder?', $suspense, secondKit)

   function wrapRenderPlaceholder(renderPlaceholder: RenderFunction) {
      return () => {
         try {
            pushAwaiting($suspense!)
            return renderPlaceholder($suspense)
         }
         finally {
            popAwaiting()
         }
      }
   }

   return {
      ions,
      renderResolved,
      renderPlaceholder,
      renderError,
      timeout
   }
}






export function createAwaitSeries(
   series:
      [AwaitKit]
      | [AwaitKit, { renderError: RenderError }]
      | [AwaitKit, { renderPlaceholder: RenderFunction, timeout?: number }]
      | [AwaitKit, { renderPlaceholder: RenderFunction, timeout?: number }, { renderError: RenderError }]
) {
   const { renderError, renderPlaceholder, renderResolved, ions, timeout } = unpackAwaitSeries(series)

   const $error = Ion(undefined as undefined | Error);
   const $renderPlaceholder = Ion(true as boolean | undefined);

   for (const ion of ions) {
      const $promise = 'pending' in ion ? () => ion.pending : ion
      watch($promise, ({ current: promis, previous }) => {
         // if (previous === undefined) {
         //    console.log('*** A', $async.pending)
         //    return;
         // }
         const pending = isPending()
         console.log('pending', pending)
         // if (pending) {
         //    $renderPlaceholder.value = true
         // }
         // else {
         //    $renderPlaceholder.value = false
         // }


         const usePlaceholder = $renderPlaceholder()
         if (usePlaceholder === pending) {
            console.warn('use placeholder', usePlaceholder)
            return;
         }
         $renderPlaceholder.value = pending && !shouldHold()
         console.log('$renderPlaceholder', $renderPlaceholder())
      }, { phase: PRELUDE })
   }

   function shouldHold() {
      placeholder = renderPlaceholder()
      if (placeholder === undefined) {
         // console.log('*** C1')
         return true;
      }
      if (placeholder instanceof Array) {
         if (placeholder.length > 1) {
            // console.log('*** C2')
            return false;
         }
         else {
            // console.log('*** C3')
            return placeholder[0] === undefined
         }
      }
      // console.log('*** C4')
      if (__DEV__) throw new Error('Invalid render function output')
   }

   function isPending() {
      for (const ion of ions) {
         // NOTE: Do not try to simplify this control flow. This is the flow we need.
         if ('pending' in ion) {
            console.log('yes pending in ion')
            if (ion.pending) return true
         }
         else {
            if (ion()) return true
         }
      }
      return false;
   }

   let placeholder = renderPlaceholder()

   const awaitSeries = createIfSeries([
      If($renderPlaceholder, () => {

         // console.log('RENDER PLACEHOLDER')
         return placeholder
      }),
      ElseIf($error, () => renderError($error()!)),
      Else('mount', renderResolved)
   ])

   return awaitSeries

   // const awaitStack = getAwaitStack()
   // const $pending = Ion(true);
   // const $error = Ion(undefined as undefined | Error);

   // let timeoutID: any;
   // if (timeout) {
   //    timeoutID = setTimeout(() => {
   //       $error.value = new Error("Timed out");
   //       $pending.value = false
   //    }, timeout)
   // }

   // // collect promises
   // const pendingPromises: Promise<unknown>[] = []
   // const $promises: Ion<Promise<unknown> | null>[] = []
   // const suspenseCollection = { promises: pendingPromises, $promises }
   // if (suspenseIons) {
   //    for (const ion of suspenseIons) {
   //       if (ion.loading)
   //          pendingPromises.push(ion.loading)
   //    }
   // }

   // const awaitSeries = createIfSeries([
   //    If($pending, renderPlaceholder),
   //    ElseIf($error, () => renderError($error()!)),
   //    Else(() => { // FIX:
   //       try {
   //          awaitStack.push(suspenseCollection);
   //          return renderResolved()
   //       }
   //       finally {
   //          awaitStack.pop();
   //          if (pendingPromises.length === 0) {
   //             return;
   //          }
   //          const allPromises = Promise.all(pendingPromises);
   //          allPromises
   //             .then(() => {
   //                clearTimeout(timeoutID)
   //                $pending.value = false
   //             })
   //             .catch(err => {
   //                if (renderError === undefined) throw toError(err);
   //                $error.value = toError(err);
   //                $pending.value = false
   //             })

   //          let promiseCount = 0;

   //          for (const $promise of $promises) {
   //             watch($promise, ({ current: promise }) => {
   //                if (promise === null) {
   //                   // if (promiseCount === 1) $pending.value = false;
   //                   // promiseCount--
   //                   return;
   //                }
   //                promiseCount++
   //                if ($pending() === true) {
   //                   clearTimeout(timeoutID)
   //                }
   //                $pending.value = true;

   //                if (timeout) {
   //                   timeoutID = setTimeout(() => {
   //                      $error.value = new Error("Timed out");
   //                      $pending.value = false
   //                   }, timeout)
   //                }

   //                promise
   //                   .then(() => {
   //                      clearTimeout(timeoutID)
   //                      promiseCount--
   //                      if (promiseCount === 0)
   //                         $pending.value = false
   //                   })
   //                   .catch(err => {
   //                      if (renderError === undefined) throw toError(err);
   //                      $error.value = toError(err);
   //                      $pending.value = false
   //                   })
   //             }, { phase: PRELUDE })
   //          }
   //       }
   //    })
   // ])

   // return awaitSeries
}

//@ts-expect-error
window._$$AwaitSeries = createAwaitSeries

