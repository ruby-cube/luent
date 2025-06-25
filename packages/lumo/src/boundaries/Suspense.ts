import { ion, __addDevName, ionicTask, Ion, MutableIon } from "../../../quarky/src";
import { Else, ElseIf, If } from "../conditional/If";
import { JSXNode } from "../node/makeNode";
import { defineGlobal } from "../commons/centralized";



const getAwaitStack = defineGlobal('awaitStack', () => [] as Promise<any>[][])

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

export type SuspenseNodeInput = {
   timeout?: number,
   await?: Promise<any> | Promise<any>[],
   standin?: () => JSXNode
   catch?: (error: Error) => JSXNode
}

export function createSuspenseNode(Slot: () => JSXNode, input: SuspenseNodeInput) {
   const awaitStack = getAwaitStack()
   const { standin: renderPlaceholder = () => undefined, timeout, catch: renderError = () => undefined } = input;
   const $pending = ion(true);
   const $error = ion(undefined as undefined | Error);
   // const $ready = ion(false);
   if (__DEV__) __addDevName($pending, "$pending");

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
   const output = Slot(); // any nested pend calls will collect promises into the pendingPromises array
   const allPromises = Promise.all(pendingPromises);
   awaitStack.pop();
   allPromises
      .then(() => {
         clearTimeout(timeoutID)
         $pending.state = false
         // $ready.state = true
      })
      .catch(err => {
         if (input.catch === undefined) throw typeof err === 'string' ? new Error(err) : err;
         $error.state = typeof err === 'string' ? new Error(err) : err;
         $pending.state = false
      })

   return [
      If($pending, renderPlaceholder),
      ElseIf($error, () => renderError($error()!)),
      Else(() => output)
   ]
}



type Suspense<T> = MutableIon<Promise<T> | T | Error> & { abort?: () => void, retry?: () => void }
type Awaited<T> = MutableIon<Promise<T> | T | Error> & { abort?: () => void, retry?: () => void }


export function assertResolved<T>(suspense: Suspense<T>): asserts suspense is MutableIon<T> {
   if (suspense instanceof Promise)
      throw Error('suspense not resolved yet')
   if (suspense instanceof Error)
      throw Error('suspense has errored')
   return;
}

export function isResolved<T>(suspense: Suspense<T>): suspense is MutableIon<T> {
   return !(suspense.state instanceof Promise || suspense.state instanceof Error)
}

export function isPending(ion: Suspense<unknown>) {
   return ion.state instanceof Promise;
}

export function suspense<T, B extends boolean, OPT = undefined>(input: Promise<T> | ((suspense: Suspense<T>) => Promise<T>), options?: OPT & { mustAwait: B }): OPT extends undefined ? Suspense<T> : B extends true ? Awaited<T> : Suspense<T> {
   if (input instanceof Promise) {
      if (options?.mustAwait) pend(input)
      const $ion = ion(input as Promise<T> | T | Error) as MutableIon<Promise<T> | T | Error>

      input
         .then(value => $ion.state = value)
         .catch(err => {
            $ion.state = new Error(err) //FIX:
         })

      return $ion;
   }
   const $ion = ion(undefined) as MutableIon<Promise<T> | T | Error>

   let initial = true;
   ionicTask(() => {
      const promise = $ion.state = input($ion);
      if (initial && options?.mustAwait)
         (initial = false, pend(promise))

      promise
         .then(value => $ion.state = value)
         .catch(err => {
            $ion.state = new Error(err) //FIX:
            throw err;
         })
   })
   return $ion;
}

