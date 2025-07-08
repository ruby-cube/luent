import { SYNC } from "../effect-cycle/EffectCycle";
import { Effect, WatchedAtom } from "../effect-cycle/EffectQueue";
import { scheduleSyncEffects } from "../effect-cycle/SyncEffects";
import { scheduleEffects } from "../ReactivitySystem";


export type Watchable = {
   asWatched?: Watched
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

   effects: AtomPhaseMap = new AtomPhaseMap('effects')

   watchCount: number = 0

   link(effect: Effect, phase: string) {
      this.effects.link(effect, phase)
      this.watchCount++
   }

   unlink(effect: Effect, phase: string) {
      this.effects.unlink(effect, phase)
      if (this.watchCount === 0) {
         this.emitDiscard()
      }
   }

   triggerEffects() { // the surrounding effect when original trigger happened
      for (const [phase, atomicEffects] of this.effects) {
         if (phase === SYNC) {
            scheduleSyncEffects(atomicEffects);
         }
         else {
            scheduleEffects(atomicEffects!, phase)
         }
      }
   }



   // private scheduleReabsorption(phase: string) {
   //    const completed = this.completedEffects.get(phase);
   //    if (completed || completed === null) return;
   //    this.completedEffects.set(phase, null);
   //    getEffectCycle().onComplete(() => { //TODO: simple hooks like this do not need to be flasked listeners... too much overhead
   //       const completed = this.completedEffects.get(phase)
   //       if (completed) this.effects.absorb(completed, phase)
   //       this.completedEffects.delete(phase)
   //    })
   // }

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


class AtomPhaseMap extends Map<string, WatchedAtom> {
   constructor(
      public __DEV__name: string
   ) {
      super();
   }

   private initializeAtom(phase: string) {
      const atom: WatchedAtom = new WatchedAtom()
      this.set(phase, atom);
      return atom
   }

   /**
     * To be called by watch() when initializing watcher
     * @param effect 
     */
   link(effect: Effect, phase: string) {
      const atom = this.get(phase) ?? this.initializeAtom(phase);
      effect.link(atom)
   }

   /**
    * To be called by watcher's stop() function
    * @param effect 
    */
   unlink(effect: Effect, phase: string) {
      const atom = this.get(phase) ?? this.initializeAtom(phase);
      effect.unlink(atom)
   }
}