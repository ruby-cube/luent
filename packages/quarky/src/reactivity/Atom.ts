import { isObject, __DEV__unwrap } from "@rue/utils";
import { Phase, SYNC, Update } from "./UpdateCycle";
import { Effect, EffectQueue } from "./EffectQueue";
import { hasQuark, Quark, QUARK } from "../abstract/Quark";
import { ILazyState } from "./LazyStateV2";


// const ATOMIC = Symbol('atomic')


// export class AtomicQuark implements Atom, Quark {
//    pendingUpdate: null | Update = null
//    quarkType = ATOMIC
//    trigger = trigger
//    asTrackedAtom: undefined | TrackedAtom
// }


// export function isAtomic(value: unknown): value is { [QUARK]: AtomicQuark } {
//    return hasQuark(value) && quarkOf(value).quarkType === ATOMIC
// }


// export function isAtomicQuark(value: unknown): value is AtomicQuark {
//    return value instanceof Object && 'quarkType' in value && value.quarkType === ATOMIC
// }


export type Atom = {
   asTrackedAtom: TrackedAtom | undefined;
   pendingUpdate: Update | null
}


/**
 * @param quark 
 * @param op 
 * @param args 
 * @param output 
 * @param preopData 
 */
export function trigger(
   atom: Atom,
   update: Update
) {
   if (update === atom.pendingUpdate) return;
   atom.pendingUpdate = update;
   atom.asTrackedAtom?.triggerEffects(update)
}


// export function isWatchable(value: unknown): value is Atom & Quark {
//    return isObject(value) && 'asTrackedAtom' in value;
// }


export function isTrackableAtom(value: unknown): value is { [QUARK]: Atom & Quark } {
   return hasQuark(value) && 'asTrackedAtom' in value[QUARK];
}


export function asTrackedAtom(watchable: Atom) {
   return watchable.asTrackedAtom ?? (watchable.asTrackedAtom = new TrackedAtom(watchable))
}


export class TrackedAtom {

   constructor(
      public entity: Atom
   ) {

   }

   private effects: Map<Phase, EffectQueue> = new Map()


   private phases: Phase[] = []


   private initializePhase(phase: Phase) {
      this.phases.push(phase)
      const queue: EffectQueue = new EffectQueue(phase, this)
      this.effects.set(phase, queue);
      return queue
   }


   /**
     * To be called by watch() when initializing watcher
     * @param effect 
     */
   link(effect: Effect) {
      const phase = effect.phase;
      const phaseQueue = this.effects.get(phase) ?? this.initializePhase(phase);
      phaseQueue.queue(effect)
      // this.watchCount++
   }


   triggerEffects(update: Update) { // the surrounding effect when original trigger happened
      const phases = this.phases
      const cycle = update.cycle
      for (const phase of phases) {
         const queue = this.effects.get(phase)!
         cycle.scheduleEffects(queue, phase)
         if (phase === SYNC) {
            cycle.runSyncEffects()
         }
      }
   }
}


