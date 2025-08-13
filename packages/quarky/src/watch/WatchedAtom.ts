import { isObject, __DEV__unwrap } from "@rue/utils";
import { Phase, SYNC } from "../effect-cycle/EffectCycle";
import { Effect, PhaseQueue } from "../effect-cycle/EffectQueue";
import { hasQuark, Quark, QUARK } from "../Quark";
import { Update } from "../effect-cycle/ReactivitySystem";
import { watch } from "fs";


export type Watchable = {
   asWatchedAtom: WatchedAtom | undefined;
   pendingUpdate: Update | null;
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
   const pendingUpdate = this.pendingUpdate
   if (pendingUpdate === update) return;
   if (pendingUpdate && pendingUpdate !== update) {
      console.log('>>> CANCEL', pendingUpdate)
      pendingUpdate.cancel()
   }
   this.pendingUpdate = update
   update.queue(() => {
      this.pendingUpdate = null;
   })
   update.onCancel(() => {
      this.pendingUpdate = null;
   })
   this.asWatchedAtom?.triggerEffects(update)
}

export function isWatchable(value: unknown): value is Watchable & Quark {
   return isObject(value) && 'asWatchedAtom' in value;
}
export function isWatchableEntity(value: unknown): value is { [QUARK]: Watchable & Quark } {
   return hasQuark(value) && 'asWatchedAtom' in value[QUARK];
}

export function asWatchedAtom(watchable: Watchable) {
   return watchable.asWatchedAtom ?? (watchable.asWatchedAtom = new WatchedAtom(watchable))
}

// export function unwatch(this: Watchable) {
//    this.asWatchedAtom = undefined
// }

export class WatchedAtom {

   constructor(
      public entity: Watchable
   ) { 

   }

   private effects: Map<Phase, PhaseQueue> = new Map()

   // private watchCount: number = 0
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


