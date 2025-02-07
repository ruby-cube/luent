import { AtomicIon, ionize, isAtomicIon, Phase, watch } from "@rue/quarky"
import { isTrackedOp, TrackedOp } from "../../../quarky/src/ionized/TrackedOp";
import { isPropIon, PropIon } from "../../../quarky/src/ionized/PrimaryPion";
import { quarksOf, hasQuarks } from "../../../quarky/src/QuarkyEntity";
import { getTrace } from "../../../flask/debug";



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
         newState: hasQuarks(atom) ? quarksOf(atom).state : atom.state, //TODO:
         oldState: hasQuarks(atom) ? quarksOf(atom).prevState : atom.prevState //TODO:
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
         //FIX: atom.__DEV__logTrace
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
   const originTrace = quarksOf(atom).__DEV__origin
   console.log('\n[TRIGGER TRACE] for ion')
   console.log('NonError ion origin trace\n    ' + originTrace)
}

function logPropTrace(atom: PropIon) {
   const quarks = quarksOf(atom)
   const originTrace = quarks.__DEV__origin //TODO: add property
   console.log(`\n[TRIGGER TRACE] for ionic property "${String(quarks.key)}"`)
   console.log('NonError origin trace\n    ' + originTrace)
}

function logTrackedOpTrace(atom: TrackedOp) {
   const originTrace = atom.__DEV__origin //TODO: add property
   console.log(`\n[TRIGGER TRACE] for ionic op "${String(atom.op)}"`) //QUESTION: should i provide entryKey?
   console.log('NonError origin trace\n    ' + originTrace)
}


