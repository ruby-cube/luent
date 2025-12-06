import { __DEV__unwrap, noop } from "@rue/utils";
import { TrackedAtom } from "./Atom";
import { catchCancelledUpdate } from "./IdleUpdate";
import { RenderCycle, Phase, POSTLUDE, PRELUDE, RENDER, SYNC, TICK, CycleProcess } from "./RenderCycle";
import { $activeUpdate, Update, instantUpdate, popUpdate, pushUpdate, tickUpdate } from "./Update";
import { queueTask } from "@rue/thread";

// const PRELUDE = 0 //QUESTION: Should UpdateCycle and EffectQueue belong to Lumo also??

type TaskFn = (...args: any[]) => unknown

export class Effect {
   constructor(
      public run: TaskFn | null,
      public phase: Phase
   ) { }

   private atoms: Set<TrackedAtom> = new Set()

   isLinked(atom: TrackedAtom) {
      return this.atoms.has(atom)
   }

   link(atom: TrackedAtom) {
      if (this.isLinked(atom)) return;
      atom.link(this)
      this.atoms.add(atom);
   }

   destroy() {
      this.run = null;
      this.unlinkAtoms()
   }

   unlink(atom: TrackedAtom) {
      if (!this.isLinked(atom)) return;
      this.atoms.delete(atom)
   }

   // FIX: unlinking needs to remove effect from the atom's phase queue
   unlinkAtoms() {
      this.atoms.clear()
   }
}


let effectStackCount = 0;

export class EffectQueue {
   effects: Effect[] | undefined;
   nextEffects: Effect[] = []
   retained: Set<Effect> = new Set()

   constructor(
      private phase: Phase,
      private atom?: TrackedAtom
   ) {
   }


   *runEffects(/* run: (effect: Effect) => void,  */completed: Set<Effect> | undefined, process?: CycleProcess, onComplete: () => void = noop) {
      const effects = this.nextEffects
      this.nextEffects = []
      const phase = this.phase
      const sync = phase === SYNC

      const limit = effects.length

      for (let i = 0; i < limit; i++) {
         const effect = effects[i]
         if (
            !effect.run
            || this.atom && !effect.isLinked(this.atom) // weeds out effects that have been unlinked due to retracking
         ) {
            continue;
         }
         // prevent repeats within queue (but not across extended queues and phases)
         if (completed?.has(effect)) {
            this.retain(effect)
            continue;
         }

         try {
            effectStackCount++
            if (effectStackCount > 100_000) throw new Error('Infite loop detected')
            effect.run?.()
         }
         catch (err) {
            catchCancelledUpdate(err)
         }
         finally {
            effectStackCount--
            completed?.add(effect)
            this.retain(effect)
         }

         if (process && process.mustPause() && i + 1 < limit) {
            const update = $activeUpdate()
            if (update) {
               popUpdate()
               process.prepPause(() => {
                  pushUpdate(update)
               })
            }
            else {
               process.prepPause()
               console.warn('no update :(')
            }
            yield;
         }
      }

      if (sync && effectStackCount !== 0) {
         return;
      }

      this.effects = undefined
      this.retained.clear()
      onComplete()
   }

   retain(effect: Effect) {
      if (this.retained.has(effect) || !effect.run || this.atom && !effect.isLinked(this.atom)) return;
      this.nextEffects.push(effect)
      this.retained.add(effect)
   }

   /**
   * To be called by watch() when initializing watcher
   * @param effect 
   */
   queue(effect: Effect) {
      this.nextEffects.push(effect)
   }

   requeued: boolean = false;
   queued: boolean = false
}

class IdleEffectQueue extends EffectQueue {

}


class EffectsComplete { // FIX: use array instead of promise

   constructor(
      private promise: Promise<unknown>,
      private runWithUpdate: (fn?: ((value?: unknown) => void) | null) => void
   ) {
   }

   then(
      onfulfilled?: ((value: unknown) => void | PromiseLike<void>) | null,
      onrejected?: ((reason: any) => PromiseLike<never>) | null
   ): Promise<void> {
      return this.promise.then(
         // onfulfilled
         () => this.runWithUpdate(onfulfilled) // TODO: wrap for loop in update, not each task
         , onrejected)
   }

   catch(onrejected?: ((reason: any) => PromiseLike<never>) | null | undefined) {
      return this.promise.catch((err) => { onrejected?.(err); throw err })
   }

   finally(onfinally?: (() => void) | null | undefined): Promise<unknown> {
      return this.promise.finally(onfinally)
   }
}


/**
 * Belongs to the current effect cycle.
 */
export class TaskQueue {
   moreEffects: EffectQueue[] | undefined;
   effects: EffectQueue[] = []
   tasks: (() => void)[] = []

   cancel!: () => void;

   started = false;

   constructor(
      public update: Update,
      protected phase: Phase
   ) { }

   scheduleTask(task: () => void) {
      this.tasks.push(task)
   }

   scheduleEffects(effects: EffectQueue) {
      if (this.phase === TICK) console.warn('ACK THERE ARE TICK EFFECTS')
      if (this.runningEffects && !effects.requeued) {
         effects.requeued = true;
         const extension = this.moreEffects ?? (this.moreEffects = [])
         extension.push(effects)
      }
      else if (!effects.queued) {
         this.effects.push(effects)
         effects.queued = true;
      }
   }

   runningEffects: boolean = false

   runEffects(cycle: RenderCycle) {
      this.started = true;
      this.runBatches(
         // (effect) => this.runEffect(effect),
         this.phase === SYNC ? undefined : new Set(),
         () => this.runMoreEffects(cycle)
      )
      // --- DO NOT WRITE CODE UNDER THIS LINE; GENERATOR MAY BE PAUSED----
   }

   runBatches(/* run: (effect: Effect) => void,  */completed: Set<Effect> | undefined, onComplete: () => void) {
      const queues = this.effects;
      for (const batch of queues) {
         batch.runSyncEffects(/* run,  */completed)
         // TODO: yield if runEffects is paused
         batch.queued = this.moreEffects?.length ? batch.requeued : false;
         batch.requeued = false;
      }
      onComplete()
   }

   runMoreEffects(cycle: RenderCycle) {
      this.effects = this.moreEffects ?? []
      this.moreEffects = undefined;
      if (this.effects.length) {
         this.runEffects(cycle)
      }
   }

   runTasks() {
      const tasks = this.tasks;
      for (let i = 0; i < tasks.length; i++) {
         tasks[i]()
      }
   }

   // runEffect(effect: Effect) {
   //    const update = this.update

   //    try {
   //       this.runningEffects = true
   //       pushUpdate(update)
   //       effect.run?.()
   //    }
   //    catch (err) {
   //       catchCancelledUpdate(err)
   //    }
   //    finally {
   //       popUpdate()
   //       this.runningEffects = false
   //    }
   // }
}

class IdleTaskQueue extends TaskQueue {

}


/**
 * Belongs to the current effect cycle.
 */
export class PreludeTaskQueue extends TaskQueue {

   constructor(
      public update: Update,
   ) {
      super(update, PRELUDE)
   }

   emitBatchesComplete: (() => void) | undefined
   idleCount = 0;



   // override runEffects(cycle: RenderCycle, onComplete: (resolve: Function) => void) {
   //    this.started = true;
   //    new Promise<void>(emitBatchesComplete => {
   //       const update = this.update;
   //       this.runBatches(
   //          update.idle
   //             ? (effect: Effect) => { this.scheduleIdleEffect(effect) }
   //             : (effect: Effect) => { this.runEffect(effect) },
   //          new Set()
   //       )
   //       if (this.idleCount === 0) {
   //          emitBatchesComplete()
   //       }
   //       else {
   //          this.emitBatchesComplete = emitBatchesComplete
   //       }
   //    }).then(() => {
   //       this.runMoreEffects(cycle, onComplete)
   //    })
   //    return this.effectsComplete
   // }

   private get deadline() {
      const update = this.update;
      if (typeof update.idle === 'number') {
         const elapsed = Date.now() - update.timestamp
         const timeLeft = update.idle - elapsed
         return timeLeft > -1 ? timeLeft : 0
      } else {
         return undefined
      }
   }

   scheduleIdleEffect(effect: Effect) {
      const update = this.update
      this.idleCount++;
      requestIdleCallback(() => {
         try {
            this.runningEffects = true
            pushUpdate(update)
            effect.run?.();
         }
         catch (err) {
            catchCancelledUpdate(err)
         }
         finally {
            popUpdate()
            this.runningEffects = false
            this.idleCount--
            if (this.idleCount === 0) {
               this.emitBatchesComplete?.()
            }
         }
      }, { timeout: this.deadline })
   }
}



/**
 * Belongs to the current effect cycle.
*/
export class TickTaskQueue extends TaskQueue {
   constructor(
      public update: Update,
   ) {
      super(update, TICK)
      // , (fn?: (() => void) | null) => {
      //    return () => {
      //       if (!fn) return;
      //       tickUpdate(fn, this.update)
      //    }
      // })
   }

   // emitBatchesComplete: (() => void) | undefined
   // idleCount = 0;

   override scheduleTask(task: () => void) {
      this.tasks.push(() => {
         instantUpdate(task)
      })
   }

   // override runEffects(cycle: RenderCycle, onComplete: (resolve: Function) => void) {
   //    new Promise<void>(emitBatchesComplete => {
   //       this.runBatches(
   //          (effect: Effect) => { this.scheduleIdleEffect(effect) },
   //          new Set()
   //       )
   //       if (this.idleCount === 0) {
   //          emitBatchesComplete()
   //       }
   //       else {
   //          this.emitBatchesComplete = emitBatchesComplete
   //       }
   //    }).then(() => {
   //       this.runMoreEffects(cycle, onComplete)
   //    })
   //    return this.effectsComplete
   // }

   // scheduleIdleEffect(effect: Effect) {
   //    console.trace('tick idle', this.update.idle)
   //    this.idleCount++;
   //    requestIdleCallback(() => {
   //       try {
   //          this.runningEffects = true
   //          this.runWithUpdate(effect.run)
   //       }
   //       finally {
   //          this.runningEffects = false
   //          this.idleCount--
   //          if (this.idleCount === 0) {
   //             this.emitBatchesComplete?.()
   //          }
   //       }
   //    }, { timeout: 17 })
   // }
}
