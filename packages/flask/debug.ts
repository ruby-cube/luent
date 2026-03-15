import { AsyncState } from "./context/AsyncContext";

export const TRACE = 'trace'

export const [getAsyncPath, __DEV__traceStack] = __DEV__ ? AsyncState<string>(TRACE) : [];

const __INTERNAL_TRACE__ = false;

export function __DEV__getTrace() {
   // if (true) return
   return __INTERNAL_TRACE__ ? getInternalTrace(__DEV__getTrace.name) : getPublicTrace()
}

export function __DEV__buildAsyncPath() {
   // if (true) return;
   const currentTrace = getAsyncPath?.()
   const trace = __DEV__getTrace()
   return (trace ? trace + '\n' : '') + (currentTrace ? '    at async ' + currentTrace?.slice(3) : '')
}

export function traceAsyncPath(label?: string) {
   const trace = __DEV__getTrace()
   if (label) console.log(`# ${label}`)
      // console.trace()
   console.log('%casync trace:', 'font-weight: bold')
   console.log(`%c    ` + (trace ? trace + '\n    ' : '') + '%cat async%c ' + getAsyncPath?.()?.slice(3).trimEnd(), 'padding-block: .25em', 'font-weight: bold', 'font-weight: regular; padding-block: .25em')
   // console.log(`NonError Async Trace:\n    ` + (trace ? trace + '\n    ' : '') + 'at async ' + getAsyncPath?.()?.slice(3).trimEnd())
}


// TODO: add async context to await, promises, and any other registered functions via compiler

export function getTrace() {
   Error.stackTraceLimit = Infinity;
   try {
      throw new Error('Trace')
   }
   catch (err) {
      return err instanceof Error ? err.stack ?? err : err
   }
}

const libraryPaths = ['/packages/'] // TODO: make this configurable




export function getPublicTrace() {
   if (!__DEV__) return;
   const rawTrace = getTrace() as string;
   const traceLines = rawTrace.split('\n');
   traceLines.shift()
   let appLines = traceLines;
   for (const path of libraryPaths) {
      appLines = appLines.filter((line) => !line.includes(path))
   }
   if (appLines.length) {
      return appLines.reduce((prev, line) => prev + '\n' + line).trim()
   }
   return undefined
}

export function getInternalTrace(cutoff: string) {
   // if (true) return;
   const rawTrace = getTrace() as string;
   const rawTraceTail = rawTrace.split(cutoff).at(-1)!
   return rawTraceTail.slice(rawTraceTail.indexOf('at ')).trim()
}