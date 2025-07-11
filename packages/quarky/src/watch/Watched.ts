import { isObject } from "@rue/utils";
import { SYNC } from "../effect-cycle/EffectCycle";
import { Effect, PhaseAtom } from "../effect-cycle/EffectQueue";
import { scheduleEffects } from "../ReactivitySystem";
import { hasQuark, Quark, QUARK } from "../Quark";


export type Watchable = {
   asWatched: Watched | undefined,
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
   this.asWatched?.triggerEffects()
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

// export function unwatch(this: Watchable) {
//    this.asWatched = undefined
// }

export class Watched {

   constructor(
      private watchable: Watchable
   ) { }

   private effects: Map<string, PhaseAtom> = new Map()

   private watchCount: number = 0

   private initializeAtom(phase: string) {
      const atom: PhaseAtom = new PhaseAtom()
      this.effects.set(phase, atom);
      return atom
   }

   /**
     * To be called by watch() when initializing watcher
     * @param effect 
     */
   link(effect: Effect, phase: string) {
      const atom = this.effects.get(phase) ?? this.initializeAtom(phase);
      atom.link(effect)
      this.watchCount++
   }

   /**
    * To be called by watcher's stop() function
    * @param effect 
    */
   unlink(effect: Effect, phase: string) {
      const atom = this.effects.get(phase) ?? this.initializeAtom(phase);
      atom.unlink(effect)
      if (this.watchCount === 0) {
         this.emitDiscard()
      }
   }

   triggerEffects() { // the surrounding effect when original trigger happened
      for (const [phase, atom] of this.effects) {
         if (phase === SYNC) {
            atom.runSyncEffects()
         }
         else {
            scheduleEffects(atom!, phase)
         }
      }
   }

   runSyncEffects() {
      const phaseAtom = this.effects.get(SYNC)
      phaseAtom?.runSyncEffects()
   }

   private cleanups: (() => void)[] = []

   onDiscard(cleanUp: () => void) {
      this.cleanups.push(cleanUp)
   }

   private emitDiscard() {
      this.watchable.asWatched = undefined;
      for (const cleanUp of this.cleanups) {
         cleanUp()
      }
   }
}


