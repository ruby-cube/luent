import { getPublicTrace } from "../../../flask/debug"

export interface TraceableEntity {
   asTraceable?: Traceable
}

export class Traceable {
   constructor(
      public name: string = "",
      public origin: string = getOriginTrace()
   ) { }
}

export class TraceableMutable extends Traceable {
   traceMutation: boolean = false
   logTrigger: boolean | (() => void) = false
}

function getOriginTrace() {
   const trace = getPublicTrace()
   if (!trace) return '';
   return 'at ' + trace?.split('at')[1].trim()
}