import { SYNC } from "../effect-cycle/EffectCycle";
import { EffectLink, EffectVine } from "../effect-cycle/EffectLink";
import { PhaseMap } from "../effect-cycle/PhaseMap";
import { scheduleSyncEffects } from "../effect-cycle/SyncEffects";
import { getEffectCycle, scheduleEffects } from "../ReactivitySystem";


export type Watchable = {
   asWatched?: Watched
   watch: () => Watched
   unwatch: () => void
}

export function watch(this: Watchable) {
   return this.asWatched ?? (this.asWatched = new Watched(this))
}

export function unwatch(this: Watchable) {
   this.asWatched = undefined
}

export class Watched<T extends Watchable = Watchable> {

   constructor(
      public quark: T
   ) {
   }

   effects: PhaseMap = new PhaseMap('effects')
   private nextCycleEffects: PhaseMap | undefined;

   private _completedEffects: PhaseMap | undefined;

   get completedEffects() {
      return this._completedEffects || (this._completedEffects = new PhaseMap('completed effects'))
   }


   // private queueForNextCycle(effect: EffectLink, phase: number) {
   //    const nextCycleEffects = this.nextCycleEffects ?? (this.nextCycleEffects = new PhaseMap('next cycle effects'))
   //    let toBeQueued = nextCycleEffects.get(phase);
   //    nextCycleEffects.addToVine(effect, phase)
   //    if (!toBeQueued) {
   //       toBeQueued = nextCycleEffects.get(phase)
   //       onEffectCycleComplete(() => {
   //          this.effects.absorb(toBeQueued!, phase)
   //       })
   //    }
   // }

   watchCount: number = 0

   watch(effect: EffectLink, phase: string, forNextCycle?: boolean) {
      // if (forNextCycle) {
      //    this.queueForNextCycle(effect, phase)
      // }
      // else {
         this.effects.addToVine(effect, phase)
      // }
      this.watchCount++
   }

   unwatch(effect: EffectLink) {
      effect.remove()
      if (this.watchCount === 0) {
         this.emitDiscard()
      }
   }

   triggerEffects() { // the surrounding effect when original trigger happened
      for (const [phase, effects] of this.effects) {
         if (phase === SYNC) {
            this.scheduleSyncEffects(effects!);
         }
         else {
            scheduleEffects(effects!, phase)
            this.scheduleReabsorption(phase)
         }
      }
   }

   private scheduleReabsorption(phase: string) {
      const completed = this.completedEffects.get(phase);
      if (completed || completed === null) return;
      this.completedEffects.set(phase, null);
      getEffectCycle(phase).onComplete(() => {
         const completed = this.completedEffects.get(phase)
         if (completed) this.effects.absorb(completed, phase)
         this.completedEffects.delete(phase)
      })
   }

   private scheduleSyncEffects(effects: EffectVine) {
      scheduleSyncEffects(effects)
   }

   private cleanups: (() => void)[] = []

   onDiscard(cleanUp: () => void) {
      this.cleanups.push(cleanUp)
   }

   private emitDiscard() {
      for (const cleanUp of this.cleanups) {
         cleanUp()
      }
   }
}
