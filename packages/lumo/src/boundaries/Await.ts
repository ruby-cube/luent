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
import { Else, ElseIf, If } from "../conditional/If";


export function Await(renderResolved: RenderFunction) {
   return {
      renderResolved,
      // suspense // Suspense<T> Awaited<T> Promise<T> []
   }
}

export function Meanwhile(renderPlaceholder: RenderFunction) {
   return {
      renderPlaceholder
      // timeout
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


export function _$$AwaitSeries(series: [{ renderResolved: RenderFunction }, { renderPlaceholder: RenderFunction, timeout?: number }, { renderError: RenderError }]) {
   const awaitStack = getAwaitStack()
   const renderResolved = series[0].renderResolved;
   const renderPlaceholder = series[1].renderPlaceholder ?? (() => undefined);
   const renderError = series[2].renderError ?? (() => undefined);
   const timeout = series[1].timeout
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
         if (renderError === undefined) throw typeof err === 'string' ? new Error(err) : err;
         $error.state = typeof err === 'string' ? new Error(err) : err;
         $pending.state = false
      })

   return window.$$series(
      If($pending, renderPlaceholder),
      ElseIf($error, () => renderError($error()!)),
      Else(() => output)
   )
}

