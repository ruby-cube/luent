import { Task, onEffectCycleComplete, Phase, useEffectCycle } from "./EffectCycle";
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
      this.effects = new PhaseMap()
   }

   private nextCycleEffects: PhaseMap | undefined;
   private effects: PhaseMap;

   private initializeNextCycleEffects() {
      this.nextCycleEffects = new PhaseMap()
   }

   private queueForNextCycle(effect: EffectLink, phase: Phase) {
      if (!this.nextCycleEffects) this.initializeNextCycleEffects()
      this.nextCycleEffects!.addToSet(effect, phase)
      const toBeQueued = this.nextCycleEffects?.get(phase);
      if (!toBeQueued) return;
      const mustSetUpQueueTransfer = toBeQueued.size > 0;

      if (mustSetUpQueueTransfer) {
         onEffectCycleComplete(() => {
            for (const effect of toBeQueued!) {
               this.effects.addToSet(effect, phase)
            }
            toBeQueued.clear()
         })
      }
   }

   private queueEffect(effect: EffectLink, phase: Phase) {
      this.effects.addToSet(effect, phase)
   }

   private removeEffect(effect: EffectLink, phase: Phase) {
      this.effects.deleteFromSet(effect, phase)
   }


   watchCount: number = 0

   watch(effect: EffectLink, phase: Phase, forNextCycle?: boolean) {
      if (forNextCycle) {
         this.queueForNextCycle(effect, phase)
      }
      else {
         this.queueEffect(effect, phase)
      }
      this.watchCount++
   }

   unwatch(effect: EffectLink, phase: Phase) {
      this.removeEffect(effect, phase)
      if (this.watchCount === 0) {
         this.emitDiscard()
      }
   }

   triggerEffects() { // the surrounding effect when original trigger happened
      for (const [phase, effects] of this.effects) {
         if (phase === Phase.SYNC) {
            this.runSyncEffects(effects);
         }
         else {
            this.scheduleEffects(effects, phase)
         }
      }
   }

   private runSyncEffects(effects: EffectVine) {
      for (const effect of effects) {
         if (effectStack.has(effect)) continue;
         effectStack.push(effect)
         try {
            effect.task()
         }
         finally {
            effectStack.pop()
         }
      }
   }

   private scheduleEffects(effects: EffectVine, phase: Exclude<Phase, Phase.SYNC>) {
      const effectCycle = useEffectCycle()
      for (const effect of effects) { //TODO: Can we skip this loop and just pass the whole set to the task runner?
         effectCycle.scheduleEffect(effect, phase)
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


// export function asWatched(quark: Watchable): Watched {
//    return quark.asWatched ?? (quark.asWatched = new Watched(quark))
// }