import { AnyIon, asMetaIon, AtomicIon, ionize, isAtomicIon, Phase, watch } from "@rue/quarky"
import { isTrackedOp, TrackedOp } from "../../../quarky/src/ionize/TrackedOp";
import { isPropIon, PropIon } from "../../../quarky/src/ionize/PropIon";
import { META } from "../../../quarky/src/ReactiveEntity";

export function getTrace() {
   Error.stackTraceLimit = Infinity;
   try {
      throw new Error('Trace')
   }
   catch (err) {
      return err instanceof Error ? err.stack ?? err : err
   }
}

//at set state
//at Object.set


type MultiWatchSubjectValues<T> = { [K in keyof T]: T[K] extends (...args: any[]) => infer R ? R : T[K] }


type Atom = (AtomicIon | TrackedOp | PropIon) & { asTraceableAtom?: TraceableAtom }

class TraceableAtom {
   triggers: undefined | TriggerEvent[]
   __addTrigger(trigger: TriggerEvent) {
      let existingTriggers = this.triggers || (this.triggers = [])
      existingTriggers.push(trigger)
   }
}

function asTraceable(atom: Atom) {
   if (atom.asTraceableAtom) return atom.asTraceableAtom!;
   const traceableAtom = atom.asTraceableAtom = new TraceableAtom(atom)
   return traceableAtom
}

let triggeredAtoms: Set<Atom>; //This should be a property on the render cycle

type TriggerEvent = {
   trace: string,
   newState: any,
   oldState: any
}

export function traceTriggers<T>(subject: T) {
   if (!__DEV__) return;
   watch(subject, () => {
      const atom = getTriggeredAtoms($thisEffect()!)[0] as Atom //TODO: type casting is temporary
      const traceableAtom = asTraceable(atom)
      traceableAtom.__addTrigger({
         trace: traceTrigger(),
         newState: META in atom ? atom[META].state : atom.state, //TODO:
         oldState: META in atom ? atom[META].prevState : atom.prevState //TODO:
      })
      __logTriggeredAtom(atom)
   }, {
      phase: Phase.SYNC,
      stateChange: false
   })
}





function traceTrigger() {
   const rawTrace = getTrace() as string;
   const cutOff = rawTrace.indexOf('at set state') > -1 ? 'at set state' : 'at Object.set'
   const rawTraceTail = rawTrace.split(cutOff).at(-1)!
   return rawTraceTail.slice(rawTraceTail.indexOf('at '))
}

function __logTriggeredAtom(atom: Atom) {
   if (triggeredAtoms) {
      triggeredAtoms.add(atom)
   }
   triggeredAtoms = ionize(new Map())
   triggeredAtoms.add(atom)
   watch(triggeredAtoms, () => {
      for (const atom of triggeredAtoms) {
         if (isAtomicIon(atom)) logAtomicIonTrace(atom)
         else if (isPropIon(atom)) logPropTrace(atom);
         else if (isTrackedOp(atom)) logTrackedOpTrace(atom)
         else throw new Error('Invalid atom')

         const triggers = atom.asTraceableAtom!.triggers!
         for (const trigger of triggers) {
            console.log('State', '\n    new:', trigger.newState, '\n    old:', trigger.oldState)
            console.log('NonError Trigger Trace\n    ' + trigger.trace)
         }
      }

   }, {
      phase: Phase.CYCLE_COMPLETE
   })
}

function logAtomicIonTrace(atom: AtomicIon) {
   const originTrace = asMetaIon(atom).originTrace //TODO: add property
   console.log('\n[TRIGGER TRACE] for ion')
   console.log('NonError ion origin trace\n    ' + originTrace)
}

function logPropTrace(atom: PropIon) {
   const meta = asMetaIon(atom)
   const originTrace = meta.originTrace //TODO: add property
   console.log(`\n[TRIGGER TRACE] for ionic property "${String(meta.key)}"`)
   console.log('NonError origin trace\n    ' + originTrace)
}

function logTrackedOpTrace(atom: TrackedOp) {
   const originTrace = atom.originTrace //TODO: add property
   console.log(`\n[TRIGGER TRACE] for ionic op "${String(atom.op)}"`) //QUESTION: should i provide entryKey?
   console.log('NonError origin trace\n    ' + originTrace)
}




const libraryPaths = ['/packages/'] //TODO: make this configurable

export function getPublicTrace() {
   const rawTrace = getTrace() as string;
   const traceLines = rawTrace.split('\n');
   traceLines.shift()
   let appLines = traceLines;
   for (const path of libraryPaths) {
      appLines = appLines.filter((line) => !line.includes(path))
   }
   if (appLines.length)
      return appLines.reduce((prev, line) => prev + '\n' + line).trim()
   return undefined
}

export function getInternalTrace(cutoff: string){
   const rawTrace = getTrace() as string;
   const rawTraceTail = rawTrace.split(cutoff).at(-1)!
   return rawTraceTail.slice(rawTraceTail.indexOf('at ')).trim()
}