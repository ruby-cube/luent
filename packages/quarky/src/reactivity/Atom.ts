import { isObject, __DEV__unwrap } from "@rue/utils";
import { Update } from "./Update";
import { Effect, EffectQueue } from "./EffectQueue";
import { hasQuark, Quark, QUARK } from "../abstract/Quark";
import { Phase, SYNC } from "./EffectCycle";


export type Atom = {
   asTrackedAtom: TrackedAtom | undefined;
   // pendingUpdate: Update | null
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
   atom.asTrackedAtom?.triggerEffects(update)
}


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
   }


   triggerEffects(update: Update) { // the surrounding effect when original trigger happened
      const phases = this.phases
      const cycle = update.cycle
      for (const phase of phases) {
         cycle.scheduleEffects(this.effects.get(phase)!, phase)
         if (phase === SYNC) {
            cycle.runSyncEffects()
         }
      }
   }
}


