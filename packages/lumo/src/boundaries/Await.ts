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
import { normalizeToArray, toError, UNDEFINED } from "@rue/utils";
import { AsyncIon } from "./Suspense";
import { defineAppwide } from "../context/Centralized";
import { PRELUDE, SYNC } from "../../../quarky/src/reactivity/RenderCycle";

type AwaitKit = {
   asyncIons: AsyncIon<unknown>[] | undefined;
   renderResolved: RenderFunction;
}

type MeanwhileKit = {
   timeout: number | undefined;
   renderPlaceholder: RenderFunction;
}

export function Await(renderResolved: RenderFunction | RawJSXNode): AwaitKit
export function Await(suspense: AsyncIon<unknown> | AsyncIon<unknown>[], renderResolved: RenderFunction | RawJSXNode): AwaitKit
export function Await(renderOrSuspense: AsyncIon<unknown> | AsyncIon<unknown>[] | RenderFunction | RawJSXNode, renderResolved?: RenderFunction | RawJSXNode): AwaitKit {
   const asyncIons = renderResolved ? normalizeToArray(renderOrSuspense) as AsyncIon<unknown>[] : undefined;
   const render = renderResolved ? renderResolved as RenderFunction : renderOrSuspense as RenderFunction;
   return {
      asyncIons,
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

export function Catch(renderError: RenderError) {
   return {
      renderError
   }
}


const getAwaitStack = defineAppwide('awaitStack', () => [] as { promises: Promise<any>[], $promises: Ion<Promise<unknown> | null>[] }[])

function $awaitStack() {
   const awaitStack = getAwaitStack()
   if (awaitStack.length === 0) // awaitStack has not been initialized by Await()
      throw new Error('pend must be handled by an Await call in a parent or ancestor component');
   return awaitStack
}

export function pend(promiseValue: Promise<any> | Promise<any>[]) {
   const awaitStack = $awaitStack()
   const promise =
      promiseValue instanceof Array
         ? Promise.all(promiseValue)
         : promiseValue

   const { promises } = awaitStack.at(-1)!;
   promises.push(promise)
   return promise;
}

export function pendReload($promise: Ion<Promise<unknown> | null>) {
   const awaitStack = $awaitStack()
   const { $promises } = awaitStack.at(-1)!;
   $promises.push($promise)
   return ion;
}

export function unpackAwaitSeries(series:
   [AwaitKit]
   | [AwaitKit, { renderError: RenderError }]
   | [AwaitKit, { renderPlaceholder: RenderFunction, timeout?: number }]
   | [AwaitKit, { renderPlaceholder: RenderFunction, timeout?: number }, { renderError: RenderError }]
) {
   const awaitKit = series[0]
   const { asyncIons } = awaitKit;
   const secondKit = series[1]
   const thirdKit = series[2]
   const renderResolved = awaitKit.renderResolved;
   const renderPlaceholder = secondKit && 'renderPlaceholder' in secondKit ? secondKit.renderPlaceholder : (() => undefined);
   const renderError = secondKit && 'renderError' in secondKit ? secondKit.renderError : thirdKit?.renderError ?? (() => undefined);
   const timeout = secondKit && 'timeout' in secondKit ? secondKit.timeout : undefined

   return {
      asyncIons,
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
   const { renderError, renderPlaceholder, renderResolved, asyncIons = [], timeout } = unpackAwaitSeries(series)

   const $error = Ion(undefined as undefined | Error);
   const $renderPlaceholder = Ion(true);

   for (const $async of asyncIons) {
      watch(() => $async.pending, ({ current: promise, previous }) => {
         // if (previous === undefined) {
         //    console.log('*** A', $async.pending)
         //    return;
         // }
         const pending = isPending()
         const usePlaceholder = $renderPlaceholder()
         if (usePlaceholder === pending) {
            console.log('*** B', $async.pending)
            return;
         }
         console.log('*** C', pending, $async.pending)
         $renderPlaceholder.value = pending && notUndefined()
      }, { phase: PRELUDE })
   }
   
   function notUndefined() {
      placeholder = renderPlaceholder()
      if (placeholder === undefined) {
         console.log('*** C1')
         return false;
      }
      if (placeholder instanceof Array) {
         if (placeholder.length > 1) {
            console.log('*** C2')
            return true;
         }
         else {
            console.log('*** C3')
            return placeholder[0] !== undefined
         }
      }
      console.log('*** C4')
      if (__DEV__) throw new Error('Invalid render function output')
   }

   function isPending() {
      for (const $async of asyncIons) {
         if ($async.pending)
            return true;
      }
      return false;
   }

   let placeholder = renderPlaceholder()

   const awaitSeries = createIfSeries([
      If($renderPlaceholder, () => {
         console.log('RENDER PLACEHOLDER')
         return placeholder
      }),
      ElseIf($error, () => renderError($error()!)),
      Else(() => { console.log('RENDER RESOLVED'); return renderResolved()})
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

