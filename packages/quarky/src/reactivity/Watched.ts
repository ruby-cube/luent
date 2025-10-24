import { isObject, __DEV__unwrap } from "@rue/utils";
import { Phase, SYNC, Update } from "./UpdateCycle";
import { Effect, PhaseQueue } from "./EffectQueue";
import { hasQuark, Quark, QUARK } from "../abstract/Quark";
import { ILazyState } from "./LazyStateV2";


export type Watchable = {
   asWatched: Watched | undefined;
   state: ILazyState
   // pendingUpdate: Update | null;
   trigger: (update: Update) => void
}


/**
 * @param quark 
 * @param op 
 * @param args 
 * @param output 
 * @param preopData 
 */
export function trigger(
   this: Watchable,
   update: Update
) {
   this.asWatched?.triggerEffects(update)
}


export function isWatchable(value: unknown): value is Watchable & Quark {
   return isObject(value) && 'asWatched' in value;
}


export function isWatchableEntity(value: unknown): value is { [QUARK]: Watchable & Quark } {
   return hasQuark(value) && 'asWatched' in value[QUARK];
}


export function asWatched(watchable: Watchable) {
   return watchable.asWatched ?? (watchable.asWatched = new Watched(watchable))
}


export class Watched {

   constructor(
      public entity: Watchable
   ) {

   }

   private effects: Map<Phase, PhaseQueue> = new Map()


   private phases: Phase[] = []


   private initializePhase(phase: Phase) {
      this.phases.push(phase)
      const queue: PhaseQueue = new PhaseQueue(phase, this)
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
            cycle.runEffects(SYNC)
         }
      }
   }
}


