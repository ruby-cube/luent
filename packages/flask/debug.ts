import { getAppOnlyTrace } from "../lumo/src/watch/debug";
import { createStack, Stack } from "./context/AsyncContext";

export const asyncTraceStack: Stack<string> | undefined = __DEV__ ? createStack<string>('trace') : undefined;

function getActiveTrace() {
   return asyncTraceStack?.getCurrent()
}

export function buildTrace() {
   const currentTrace = getActiveTrace()
   const trace = getAppOnlyTrace()
   return (trace ? trace + '\n' : '') + (currentTrace ? '    at async ' + currentTrace?.slice(3) : '')
}

export function asyncTrace(){
   const trace = getAppOnlyTrace()
   console.log('NonError Async Trace\n    ' + (trace ? trace + '\n    ' : '') + 'at async ' + asyncTraceStack?.getCurrent()?.slice(3))
}
