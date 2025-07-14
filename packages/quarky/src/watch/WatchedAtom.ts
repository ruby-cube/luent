import { isObject } from "@rue/utils";
import { Phase, SYNC } from "../effect-cycle/EffectCycle";
import { Effect, PhaseEffects } from "../effect-cycle/EffectQueue";
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

   private effects: Map<Phase, PhaseEffects> = new Map()

   private watchCount: number = 0

   private initializePhase(phase: Phase) {
      const atom: PhaseEffects = new PhaseEffects(phase)
      this.effects.set(phase, atom);
      return atom
   }

   /**
     * To be called by watch() when initializing watcher
     * @param effect 
     */
   link(effect: Effect, phase: Phase) {
      const phaseQueue = this.effects.get(phase) ?? this.initializePhase(phase);
      phaseQueue.queue(effect)
      this.watchCount++
   }

   // /**
   //  * To be called by watcher's stop() function
   //  * @param effect 
   //  */
   // unlink(effect: Effect, phase: string) {
   //    const atom = this.effects.get(phase) ?? this.initializePhase(phase);
   //    atom.unlink(effect)
   //    if (this.watchCount === 0) {
   //       this.emitDiscard()
   //    }
   // }

   triggerEffects() { // the surrounding effect when original trigger happened
      for (const [phase, atom] of this.effects) {
         $currentEffectCycle().scheduleEffects(atom, phase)
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


