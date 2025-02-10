import { SetMap } from "@rue/utils";
import { Task, onEffectCycleComplete, Phase, useEffectCycle } from "./EffectCycle";


export type Watchable = {
   asWatched?: Watched
   watch: () => Watched
   unwatch: () => void
}

export function watch(quarks: Watchable, initialize: () => Watched) {
   if (!quarks.asWatched) {
      const watched = initialize()
      watched.watchCount++;
      return watched
   }
   quarks.asWatched!.watchCount++;
   return quarks.asWatched!
}

export function unwatch(watched: Watched, cleanup: () => void) {
   watched.watchCount--
   if (watched.watchCount === 0) {
      cleanup()
      //TODO: when should this be called such that we don't cause thrashing of discarding and creating an Watched more than needed? At the end of a cycle?
   }
}


export class Watched<T extends Watchable = Watchable> {
   watchCount: number = 0

   constructor(
      public quarks: T
   ) {
      this.effects = new SetMap()
   }

   // watchCount = 0
   private nextCycleEffects: SetMap<Phase, Task> | undefined;
   private effects: SetMap<Phase, Task>;

   private initializeNextCycleEffects() {
      this.nextCycleEffects = new SetMap()
   }

   private queueForNextCycle(effect: Task, phase: Phase) {
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

   private queueEffect(effect: Task, phase: Phase) {
      this.effects.addToSet(effect, phase)
   }

   private removeEffect(effect: Task, phase: Phase) {
      this.effects.deleteFromSet(effect, phase)
   }

   watch(effect: Task, phase: Phase, forNextCycle?: boolean) {
      if (forNextCycle) {
         this.queueForNextCycle(effect, phase)
      }
      else {
         this.queueEffect(effect, phase)
      }
   }

   unwatch(effect: Task, phase: Phase) {
      this.removeEffect(effect, phase)
      this.emitUnwatched()
   }

   // discard(){
   //    this.quarks.asWatched = undefined;
   //    //QUESTION: Do I need to release watchable too? this.watchable = undefined?
   // }

   prevCycle?: any //TODO: ScheduleCycle

   triggerEffects() { // the surrounding effect when original trigger happened
      // const currentCycle = $currentCycle(); 
      // if (this.prevCycle === currentCycle) return; // prevents repeats
      // this.prevCycle = currentCycle
      for (const [phase, effects] of this.effects) {
         if (phase === Phase.SYNC) {
            this.runSyncEffects(effects);
         }
         else {
            this.scheduleEffects(effects, phase)
         }
      }
   }


   private runSyncEffects(effects: Set<Task>) {
      // const tracker = getDependencyTracker();
      // tracker?.stop(); // in case reactive refs are triggered during a reactiveEffect
      for (const effect of effects) {
         // runEffect(effect)
         effect()
      }
      // tracker?.restore();
   }

   private scheduleEffects(effects: Set<Task>, phase: Exclude<Phase, Phase.SYNC>) {
      const effectCycle = useEffectCycle()
      for (const effect of effects) { //TODO: Can we skip this loop and just pass the whole set to the task runner?
         effectCycle.scheduleTask(effect, phase)
      }
   }

   private cleanups: (() => void)[] = [] //TODO: make into array

   onUnwatched(cleanUp: () => void) {
      this.cleanups.push(cleanUp)
   }

   private emitUnwatched() {
      for (const cleanUp of this.cleanups) {
         cleanUp()
      }
   }
}


// export function asWatched(quarks: Watchable): Watched {
//    return quarks.asWatched ?? (quarks.asWatched = new Watched(quarks))
// }