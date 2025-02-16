import { RENDER } from "../../../lumo/src/render/render-cycle";
import { onEffectCycleComplete, $effectCycle } from "./EffectCycle";
import { EffectLink, EffectVine } from "./EffectLink";
import { effectStack } from "./EffectStack";
import { PhaseMap } from "./PhaseMap";


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

   private effects: PhaseMap = new PhaseMap('effects')
   private nextCycleEffects: PhaseMap | undefined;

   private _completedEffects: PhaseMap | undefined;

   get completedEffects() {
      return this._completedEffects || (this._completedEffects = new PhaseMap('completed effects'))
   }


   private queueForNextCycle(effect: EffectLink, phase: number) {
      const nextCycleEffects = this.nextCycleEffects ?? (this.nextCycleEffects = new PhaseMap('next cycle effects'))
      let toBeQueued = nextCycleEffects.get(phase);
      nextCycleEffects.addToVine(effect, phase)
      if (!toBeQueued) {
         toBeQueued = nextCycleEffects.get(phase)
         onEffectCycleComplete(() => {
            this.effects.absorb(toBeQueued!, phase)
         })
      }
   }

   watchCount: number = 0

   watch(effect: EffectLink, phase: number, forNextCycle?: boolean) {
      if (forNextCycle) {
         this.queueForNextCycle(effect, phase)
      }
      else {
         this.effects.addToVine(effect, phase)
      }
      this.watchCount++
   }

   unwatch(effect: EffectLink, phase: number) {
      effect.remove()
      if (this.watchCount === 0) {
         this.emitDiscard()
      }
   }

   triggerEffects() { // the surrounding effect when original trigger happened
      for (const [phase, effects] of this.effects) {
         if (phase === 0) {
            this.runSyncEffects(effects!);
         }
         else {
            if (typeof this.quark.state === 'number') console.log('index???', this.quark.state, phase === RENDER, $effectCycle().currentPhase)
            $effectCycle().scheduleEffects(effects!, phase)
            this.scheduleReabsorption(phase)
         }
      }
   }

   private scheduleReabsorption(phase: number) {
      const completed = this.completedEffects.get(phase);
      if (completed || completed === null) return;
      this.completedEffects.set(phase, null);
      onEffectCycleComplete(() => {
         const completed = this.completedEffects.get(phase)
         if (completed) this.effects.absorb(completed, phase)
         this.completedEffects.delete(phase)
      })
   }

   private runSyncEffects(effects: EffectVine) {
      for (const effect of effects) {
         if (effectStack.has(effect)) continue; // prevents infinite loops
         effectStack.push(effect)
         try {
            effect.task()
         }
         finally {
            effectStack.pop()
         }
      }
   }

   private cleanups: (() => void)[] = [] //TODO: make into array

   onDiscard(cleanUp: () => void) {
      this.cleanups.push(cleanUp)
   }

   private emitDiscard() {
      for (const cleanUp of this.cleanups) {
         cleanUp()
      }
   }

   // discard(){
   //    this.quark.asWatched = undefined;
   //    //QUESTION: Do I need to release watchable too? this.watchable = undefined?
   // }
}
