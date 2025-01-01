import { ion, __addDevName, AtomicIon } from "../../../quarky/src";
import { Else, ElseIf, If } from "../conditional/If";
import { component, ComponentSetup } from "../component/InternalComponent";
import { NodeEntity } from "../node/makeNode";


const pendingPromisesStack: Promise<any>[][] = []

export function pend(promiseValue: Promise<any> | Promise<any>[]) {
   if (pendingPromisesStack.length === 0) throw new Error('pend must eventually be handled by a Suspense call in a parent component. If you want to handle the promise with a placeholder and error view in this component, use Suspense instead');
   const promise = promiseValue instanceof Array ?
      Promise.all(promiseValue)
      : promiseValue
   const pendingPromises = pendingPromisesStack.at(-1)!;
   pendingPromises.push(promise)
   return promise;
}

export type SuspenseNodeInput = {
   timeout?: number,
   await?: Promise<any> | Promise<any>[],
   standin?: () => NodeEntity
   catch?: (error: Error) => NodeEntity
}

export function createSuspenseNode(Slot: () => NodeEntity, input: SuspenseNodeInput) {
   const { standin: renderPlaceholder = () => undefined, timeout, catch: renderError = () => undefined } = input;
   const $pending = ion(true);
   const $error: AtomicIon<Error> = ion();
   const $ready = ion(false);
   if (__DEV__) __addDevName($pending, "$pending");

   let timeoutID: any;
   if (timeout) {
      timeoutID = setTimeout(() => {
         $error.value = new Error("Timed out");
         $pending.value = false
      }, timeout)
   }

   // collect promises
   const pendingPromises: Promise<unknown>[] = []
   pendingPromisesStack.push(pendingPromises);
   const output = Slot(); // any nested pend calls will collect promises into the pendingPromises array
   const allPromises = Promise.all(pendingPromises);
   pendingPromisesStack.pop();
   allPromises
      .then(() => {
         clearTimeout(timeoutID)
         $pending.value = false
         $ready.value = true
      })
      .catch(err => {
         if (input.catch === undefined) throw typeof err === 'string' ? new Error(err) : err;
         $error.value = typeof err === 'string' ? new Error(err) : err;
         $pending.value = false
      })

   return component(
      [
         If($pending, renderPlaceholder),
         ElseIf($error, () => renderError($error())),
         Else(() => output)
      ]
   )
}