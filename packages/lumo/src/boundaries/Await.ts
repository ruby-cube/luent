// {Await(($file = fetchFile($userID, $fileID)) =>
//    <File id={$fileID()} file={$file} />
// )}
// {Meanwhile({ timeout: 500 },
//    <Loading />
// )}
// {Catch(err =>
//    <div>{err}</div>
// )}

import { Ion,  watch } from "@rue/quarky";
import { RawJSXNode, RenderFunction } from "../node/makeJSXNode";
import { RenderError } from "./Try";
import { createIfSeries, Else, ElseIf, If } from "../conditional/If";
import { normalizeToArray, toError } from "@rue/utils";
import { SuspenseIon } from "./Suspense";
import { defineAppwide } from "../context/Centralized";
import { PRELUDE } from "../../../quarky/src/reactivity/RenderCycle";

type AwaitKit = {
   suspenseIons: SuspenseIon<unknown>[] | undefined;
   renderResolved: RenderFunction;
}

type MeanwhileKit = {
   timeout: number | undefined;
   renderPlaceholder: RenderFunction;
}

export function Await(renderResolved: RenderFunction | RawJSXNode): AwaitKit
export function Await(suspense: SuspenseIon<unknown> | SuspenseIon<unknown>[], renderResolved: RenderFunction | RawJSXNode): AwaitKit
export function Await(renderOrSuspense: SuspenseIon<unknown> | SuspenseIon<unknown>[] | RenderFunction | RawJSXNode, renderResolved?: RenderFunction | RawJSXNode): AwaitKit {
   const suspenseIons = renderResolved ? normalizeToArray(renderOrSuspense) as SuspenseIon<unknown>[] : undefined;
   const render = renderResolved ? renderResolved as RenderFunction : renderOrSuspense as RenderFunction;
   return {
      suspenseIons,
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
   const promise = promiseValue instanceof Array ?
      Promise.all(promiseValue)
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


export function createAwaitSeries(
   series:
      [AwaitKit]
      | [AwaitKit, { renderError: RenderError }]
      | [AwaitKit, { renderPlaceholder: RenderFunction, timeout?: number }]
      | [AwaitKit, { renderPlaceholder: RenderFunction, timeout?: number }, { renderError: RenderError }]
) {
   const awaitKit = series[0]
   const { suspenseIons } = awaitKit;
   const awaitStack = getAwaitStack()
   const secondKit = series[1]
   const thirdKit = series[2]
   const renderResolved = awaitKit.renderResolved;
   const renderPlaceholder = secondKit && 'renderPlaceholder' in secondKit ? secondKit.renderPlaceholder : (() => undefined);
   const renderError = secondKit && 'renderError' in secondKit ? secondKit.renderError : thirdKit?.renderError ?? (() => undefined);
   const timeout = secondKit && 'timeout' in secondKit ? secondKit.timeout : undefined
   const $pending = Ion(true);
   const $error = Ion(undefined as undefined | Error);

   let timeoutID: any;
   if (timeout) {
      timeoutID = setTimeout(() => {
         $error.value = new Error("Timed out");
         $pending.value = false
      }, timeout)
   }


   // collect promises
   const pendingPromises: Promise<unknown>[] = []
   const $promises: Ion<Promise<unknown> | null>[] = []
   const suspenseCollection = { promises: pendingPromises, $promises }
   if (suspenseIons) {
      for (const ion of suspenseIons) {
         if (ion.loading)
            pendingPromises.push(ion.loading)
      }
   }

   const awaitSeries = createIfSeries([
      If($pending, renderPlaceholder),
      ElseIf($error, () => renderError($error()!)),
      Else('show', () => {
         try {
            awaitStack.push(suspenseCollection);
            return renderResolved()
         }
         finally {
            awaitStack.pop();
            if (pendingPromises.length === 0) {
               return;
            }
            const allPromises = Promise.all(pendingPromises);
            allPromises
               .then(() => {
                  clearTimeout(timeoutID)
                  $pending.value = false
               })
               .catch(err => {
                  if (renderError === undefined) throw toError(err);
                  $error.value = toError(err);
                  $pending.value = false
               })

            let promiseCount = 0;

            for (const $promise of $promises) {
               watch($promise, ({ current: promise }) => {
                  if (promise === null) {
                     // if (promiseCount === 1) $pending.value = false;
                     // promiseCount--
                     return;
                  }
                  promiseCount++
                  if ($pending() === true) {
                     clearTimeout(timeoutID)
                  }
                  $pending.value = true;

                  if (timeout) {
                     timeoutID = setTimeout(() => {
                        $error.value = new Error("Timed out");
                        $pending.value = false
                     }, timeout)
                  }

                  promise
                     .then(() => {
                        clearTimeout(timeoutID)
                        promiseCount--
                        if (promiseCount === 0)
                           $pending.value = false
                     })
                     .catch(err => {
                        if (renderError === undefined) throw toError(err);
                        $error.value = toError(err);
                        $pending.value = false
                     })
               }, {phase: PRELUDE})
            }
         }
      })
   ])

   return awaitSeries
}

//@ts-expect-error
window._$$AwaitSeries = createAwaitSeries