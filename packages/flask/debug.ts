import { getAppOnlyTrace } from "../lumo/src/watch/debug";
import { ContextualState, Stack } from "./context/AsyncContext";

export const [getCurrentTrace, setTrace] = __DEV__ ? ContextualState<string>('trace') : [];

// function getActiveTrace() {
//    return asyncTraceStack?.[0]()
// }

// function 

export function buildTrace_DEV() {
   const currentTrace = getCurrentTrace?.()
   const trace = getAppOnlyTrace()
   return (trace ? trace + '\n' : '') + (currentTrace ? '    at async ' + currentTrace?.slice(3) : '')
}

export function asyncTrace_DEV() {
   const trace = getAppOnlyTrace()
   console.log('NonError Async Trace\n    ' + (trace ? trace + '\n    ' : '') + 'at async ' + getCurrentTrace?.()?.slice(3))
}
