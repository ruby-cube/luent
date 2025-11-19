import { ionize, isAtomic, MutableIon, SYNC, watch } from "@rue/quarky"
import { AtomicOp } from "../ionic/TrackedOp";
import { quarkOf, hasQuark } from "../abstract/Quark";
import { getTrace } from "../../../flask/debug";



//at set state
//at Object.set


type MultiWatchSubjectValues<T> = { [K in keyof T]: T[K] extends (...args: any[]) => infer R ? R : T[K] }


type Atom = (MutableIon<unknown | AtomicOp | PropIon) & { asTraceableAtom?: TraceableAtom }

class TraceableAtom {
   triggers: undefined | TriggerEvent[]
   __addTrigger(trigger: TriggerEvent) {
      let existingTriggers = this.triggers || (this.triggers = [])
      existingTriggers.push(trigger)
   }
}

function __DEV__asTraceable(atom: Atom) {
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
      const atom = getTriggeredAtoms($thisEffect()!)[0] as Atom // TODO: type casting is temporary
      const traceableAtom = __DEV__asTraceable(atom)
      traceableAtom.__addTrigger({
         trace: traceTrigger(),
         newState: hasQuark(atom) ? quarkOf(atom).state : atom.state, // TODO:
         oldState: hasQuark(atom) ? quarkOf(atom).prevState : atom.prevState // TODO:
      })
      __logTriggeredAtom(atom)
   }, {
      phase: SYNC,
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
         //FIX: atom.__DEV__logTrace
         if (isAtomic(atom)) logAtomicIonTrace(atom)
         else if (isAtomicPionQuark(quarkOf(atom))) logPropTrace(atom);
         else if (isTrackedOp(atom)) logTrackedOpTrace(atom)
         else throw new Error('Invalid atom')

         const triggers = atom.asTraceableAtom!.triggers!
         for (const trigger of triggers) {
            console.log('State', '\n    new:', trigger.newState, '\n    old:', trigger.oldState)
            console.log('NonError Trigger Trace\n    ' + trigger.trace)
         }
      }

   }, {
      // phase: RENDER_CYCLE_COMPLETE
   })
}

function logAtomicIonTrace(atom: AtomicIon) {
   const originTrace = quarkOf(atom).origin
   console.log('\n[TRIGGER TRACE] for ion')
   console.log('NonError ion origin trace\n    ' + originTrace)
}

function logPropTrace(atom: PropIon) {
   const quark = quarkOf(atom)
   const originTrace = quark.origin // TODO: add property
   console.log(`\n[TRIGGER TRACE] for ionic property "${String(quark.key)}"`)
   console.log('NonError origin trace\n    ' + originTrace)
}

function logTrackedOpTrace(atom: AtomicOp) {
   const originTrace = atom.origin // TODO: add property
   console.log(`\n[TRIGGER TRACE] for ionic op "${String(atom.op)}"`) //QUESTION: should i provide entryKey?
   console.log('NonError origin trace\n    ' + originTrace)
}


