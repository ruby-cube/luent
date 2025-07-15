import { isObject } from "@rue/utils";
import { Phase, SYNC } from "../effect-cycle/EffectCycle";
import { Effect } from "../effect-cycle/EffectQueue";
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

   // private effects: Map<Phase, PhaseQueue> = new Map()
   private effects: Effect[] = []

   // private watchCount: number = 0

   // private initializePhase(phase: Phase) {
   //    const atom: PhaseQueue = new PhaseQueue(phase)
   //    this.effects.set(phase, atom);
   //    return atom
   // }

   link(effect: Effect) {
      this.effects.push(effect)
      // const phaseQueue = this.effects.get(phase) ?? this.initializePhase(phase);
      // phaseQueue.queue(effect)
      // this.watchCount++
   }

   // /**
   //  * To be called by watcher's stop() function
   //  * @param effect 
   //  */
   // unlink(effect: Effect) {
   //    // remove effect from effect list
   //    effect.unlink()

   //    this.watchCount--
   //    if (this.watchCount === 0) {
   //       this.emitDiscard()
   //    }
   // }

   triggerEffects() { // the surrounding effect when original trigger happened
      const effects = this.effects;
      const retained = [];
      for (const effect of effects) {
         if (!effect.linked) return;
         $currentEffectCycle().scheduleEffect(effect)
         retained.push(effect)
      }
      this.effects = retained;
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


