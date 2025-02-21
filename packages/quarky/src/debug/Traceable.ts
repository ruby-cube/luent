import { getPublicTrace } from "../../../flask/debug"

export class Traceable {

   constructor() {
      this.origin = getOriginTrace()
      // this.__DEV__labels = new Set()
   }

   traceTriggers: Set<PropertyKey> = new Set()
   __DEV__traceAsyncPath: Set<PropertyKey> = new Set()
   __DEV__traceTrackers: Set<PropertyKey> = new Set()

   origin?: string
   // __DEV__labels: Set<string>
}

function getOriginTrace() {
   const trace = getPublicTrace()
   if (!trace) return '';
   return 'at ' + trace?.split('at')[1].trim()
   // console.log(trace)
   // return trace
}