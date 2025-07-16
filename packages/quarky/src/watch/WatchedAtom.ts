import { isObject, unnestOriginalFn } from "@rue/utils";
import { Phase, SYNC } from "../effect-cycle/EffectCycle";
import { Effect, PhaseQueue } from "../effect-cycle/EffectQueue";
import { $currentEffectCycle } from "../effect-cycle/ReactivitySystem";
import { hasQuark, Quark, QUARK } from "../Quark";


export type Watchable = {
   asWatchedAtom: WatchedAtom | undefined,
   trigger: () => void
}

/**
 * @param quark 
 * @param op 
 * @param args 
 * @param output 
 * @param preopData 
 */
export function trigger( //TODO: figure out which abstraction this belongs to ...  atomic ions, atomic pions, memoized derivations, but not terminal compound
   this: Watchable,
) {
   this.asWatchedAtom?.triggerEffects()
}

export function isWatchable(value: unknown): value is Watchable & Quark {
   return isObject(value) && 'asWatchedAtom' in value;
}
export function isWatchableEntity(value: unknown): value is { [QUARK]: Watchable & Quark } {
   return hasQuark(value) && 'asWatchedAtom' in value[QUARK];
}

export function asWatchedAtom(watchable: Watchable) {
   return watchable.asWatchedAtom ?? (watchable.asWatchedAtom = new WatchedAtom())
}

// export function unwatch(this: Watchable) {
//    this.asWatchedAtom = undefined
// }

export class WatchedAtom {

   constructor(
      // private watchable: Watchable
   ) { }

   private effects: Map<Phase, PhaseQueue> = new Map()

   // private watchCount: number = 0
   private phases: Phase[] = []

   private initializePhase(phase: Phase) {
      this.phases.push(phase)
      const queue: PhaseQueue = new PhaseQueue(phase)
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

   // link(effect: Effect) {
   //    this.effects.push(effect)
   //    // this.watchCount++
   // }

   // triggerEffects() { // the surrounding effect when original trigger happened
   //    const effects = this.effects;
   //    const prevLength = effects.length
   //    // const retained = []; //for cleaning up inactive effects
   //    for (const effect of effects) {
   //       if (!effect.active) {
   //          continue;
   //       }
   //       if (effect.phase === SYNC) {
   //          effect.fn?.()
   //       }
   //       else {
   //          $currentEffectCycle().scheduleEffect(effect)
   //       }
   //       // if (effect.active && effect.fn)
   //       //    retained.push(effect)
   //    }
   //    if (effects.length !== prevLength) console.warn('length changed!')
   //    // this.effects = retained;
   // }

   triggerEffects() { // the surrounding effect when original trigger happened
      const phases = this.phases
      for (const phase of phases) {
         const queue = this.effects.get(phase)!
         $currentEffectCycle().scheduleEffects(queue, phase)
         if (phase === SYNC) {
            $currentEffectCycle().runEffects(SYNC)
         }
      }
   }

   // runSyncEffects() {
   //    const phaseAtom = this.effects.get(SYNC)
   //    phaseAtom?.runSyncEffects()
   // }

   // private cleanups: (() => void)[] = []

   // onDiscard(cleanUp: () => void) {
   //    this.cleanups.push(cleanUp)
   // }

   // private emitDiscard() {
   //    this.watchable.asWatchedAtom = undefined;
   //    for (const cleanUp of this.cleanups) {
   //       cleanUp()
   //    }
   // }
}


