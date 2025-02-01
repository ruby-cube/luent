import { getInternalTrace, getPublicTrace, getTrace } from "../lumo/src/watch/debug";
import { ContextualState } from "./context/AsyncContext";

export const [getCurrentTrace, setTrace] = __DEV__ ? ContextualState<string>('trace') : [];

// function getActiveTrace() {
//    return asyncTraceStack?.[0]()
// }

// function 

const __INTERNAL_TRACE__ = false;

export function buildTrace_DEV() {
   const currentTrace = getCurrentTrace?.()
   const trace = __INTERNAL_TRACE__ ? getInternalTrace(buildTrace_DEV.name) : getPublicTrace()
   return (trace ? trace + '\n' : '') + (currentTrace ? '    at ... async ' + currentTrace?.slice(3) : '')
}

export function __DEV__asyncTrace() {
   const trace = __INTERNAL_TRACE__ ? getInternalTrace(__DEV__asyncTrace.name) : getPublicTrace()
   console.log('NonError Async Trace\n    ' + (trace ? trace + '\n    ' : '') + 'at ... async ' + getCurrentTrace?.()?.slice(3).trimEnd())
}
