// {Await(($file = fetchFile($userID, $fileID)) =>
//    <File id={$fileID()} file={$file} />
// )}
// {Meanwhile({ timeout: 500 },
//    <Loading />
// )}
// {Catch(err =>
//    <div>{err}</div>
// )}

import { ion } from "@rue/quarky";
import { defineAppwide, defineGlobal } from "../commons/centralized";
import { RenderFunction } from "../node/makeNode";
import { RenderError } from "./Try";
import { createIfSeries, Else, ElseIf, If } from "../conditional/If";
import { normalizeToArray, toError } from "@rue/utils";
import { SuspenseIon } from "./Suspense";

type AwaitKit = {
   suspense: SuspenseIon<unknown>[] | undefined;
   renderResolved: RenderFunction;
}

type MeanwhileKit = {
   timeout: number | undefined;
   renderPlaceholder: RenderFunction;
}

export function Await(renderResolved: RenderFunction): AwaitKit
export function Await(suspense: SuspenseIon<unknown> | SuspenseIon<unknown>[], renderResolved: RenderFunction): AwaitKit
export function Await(renderOrSuspense: SuspenseIon<unknown> | SuspenseIon<unknown>[] | RenderFunction, renderResolved?: RenderFunction): AwaitKit {
   const suspense = renderResolved ? normalizeToArray(renderOrSuspense) as SuspenseIon<unknown>[] : undefined;
   const render = renderResolved ? renderResolved : renderOrSuspense as RenderFunction;

   return {
      suspense,
      renderResolved: render,
   }
}

export function Meanwhile(renderPlaceholder: RenderFunction): MeanwhileKit
export function Meanwhile(options: { timeout: number }): MeanwhileKit
export function Meanwhile(renderOrOptions: RenderFunction | { timeout: number }, renderPlaceholder?: RenderFunction): MeanwhileKit {
   const timeout = renderPlaceholder ? (<{ timeout: number }>renderOrOptions).timeout : undefined
   const render = renderPlaceholder ? renderPlaceholder : renderOrOptions as RenderFunction
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


const getAwaitStack = defineAppwide('awaitStack', () => [] as Promise<any>[][])

export function pend(promiseValue: Promise<any> | Promise<any>[]) {
   const awaitStack = getAwaitStack()
   if (awaitStack.length === 0) throw new Error('pend must eventually be handled by a Suspense call in a parent component. If you want to handle the promise with a placeholder and error view in this component, use Suspense instead');
   const promise = promiseValue instanceof Array ?
      Promise.all(promiseValue)
      : promiseValue
   const pendingPromises = awaitStack.at(-1)!;
   pendingPromises.push(promise)
   return promise;
}


export function createAwaitSeries(
   series:
      [{ renderResolved: RenderFunction }]
      | [{ renderResolved: RenderFunction }, { renderError: RenderError }]
      | [{ renderResolved: RenderFunction }, { renderPlaceholder: RenderFunction, timeout?: number }]
      | [{ renderResolved: RenderFunction }, { renderPlaceholder: RenderFunction, timeout?: number }, { renderError: RenderError }]
) {
   const awaitStack = getAwaitStack()
   const secondKit = series[1]
   const thirdKit = series[2]
   const renderResolved = series[0].renderResolved;
   const renderPlaceholder = secondKit && 'renderPlaceholder' in secondKit ? secondKit.renderPlaceholder : (() => undefined);
   const renderError = secondKit && 'renderError' in secondKit ? secondKit.renderError : thirdKit?.renderError ?? (() => undefined);
   const timeout = secondKit && 'timeout' in secondKit ? secondKit.timeout : undefined
   const $pending = ion(true);
   const $error = ion(undefined as undefined | Error);

   let timeoutID: any;
   if (timeout) {
      timeoutID = setTimeout(() => {
         $error.state = new Error("Timed out");
         $pending.state = false
      }, timeout)
   }


   // collect promises
   const pendingPromises: Promise<unknown>[] = []
   awaitStack.push(pendingPromises);
   const output = renderResolved(); // any nested pend calls will collect promises into the pendingPromises array
   const allPromises = Promise.all(pendingPromises);
   console.log('allPromises', pendingPromises)
   awaitStack.pop();
   allPromises
      .then(() => {
         clearTimeout(timeoutID)
         $pending.state = false
         // $ready.state = true
      })
      .catch(err => {
         if (renderError === undefined) throw toError(err);
         $error.state = toError(err);
         $pending.state = false
      })

   return createIfSeries([
      If($pending, renderPlaceholder),
      ElseIf($error, () => renderError($error()!)),
      Else(() => output)
   ])
}

//@ts-expect-error
window._$$AwaitSeries = createAwaitSeries