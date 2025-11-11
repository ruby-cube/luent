import { __DEV__unwrap } from "@rue/utils";
import { TrackedAtom } from "./Atom";
import { catchCancelledUpdate, idleUpdate, popUpdate, pushUpdate, tickUpdate } from "./Update";
import { EffectCycle, Phase, POSTLUDE, PRELUDE, RENDER, SYNC } from "./EffectCycle";

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
// const activeEffects = new Set()

// export function $currentEffect() {
//    return _effectStack.at(-1)
// }

// export const effectStack = {
//    get size() {
//       return activeEffects.size;
//    },
//    has(effect: Effect) {
//       return activeEffects.has(effect)
//    },

//    push(effect: Effect) {
//       activeEffects.add(effect)
//       _effectStack.push(effect)
//    },

//    pop() {
//       const effect = _effectStack.pop()
//       activeEffects.delete(effect)
//    }
// }

export class EffectQueue {
   effects: Effect[] | undefined;
   nextEffects: Effect[] = []

   retained: Set<Effect> = new Set() // for sync effects
   // canIdle: boolean | undefined = undefined


   constructor(
      private phase: Phase,
      private atom?: TrackedAtom
   ) {
   }

   runEffects(run: (effect: Effect) => void, completed: Set<Effect> | undefined) {
      const effects = this.nextEffects
      this.nextEffects = []
      const phase = this.phase
      const sync = phase === SYNC
      // const canIdle = this.canIdle !== undefined ? this.canIdle : phases.length - 1 !== phase && !sync && phases[phase].canIdle

      for (const effect of effects) {
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
         // // stops infinite loops
         // if (effectStack.has(effect)
         //    // || $currentEffectCycle().effectStack.has(effect)
         // ) {
         //    if (retained.has(effect))
         //       continue;
         //    this.retain(effect)
         //    retained.add(effect)

         //    console.warn('Infinite loop prevented. Prefer derivation ions over setting state in effects')
         //    continue;
         // }
         try {
            effectStackCount++
            run(effect)
         }
         finally {
            effectStackCount--
            completed?.add(effect)
            this.retain(effect)
         }
      }

      if (sync && effectStackCount !== 0) {
         return;
      }

      this.effects = undefined
      this.retained.clear()
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


class EffectsComplete {

   constructor(
      private promise: Promise<unknown>,
      private wrap: (fn?: ((value?: unknown) => void) | null) => ((value: unknown) => void) | null
   ) {
   }

   then(
      onfulfilled?: ((value: unknown) => void | PromiseLike<void>) | null,
      onrejected?: ((reason: any) => PromiseLike<never>) | null
   ): Promise<void> {
      return this.promise.then(this.wrap(onfulfilled), onrejected)
   }

   catch(onrejected?: ((reason: any) => PromiseLike<never>) | null | undefined) {
      return this.promise.catch(onrejected)
   }

   finally(onfinally?: (() => void) | null | undefined): Promise<unknown> {
      return this.promise.finally(onfinally)
   }
}


/**
 * Belongs to the current effect cycle.
 */
export class TaskQueue {
   protected moreEffects: EffectQueue[] | undefined;
   protected effects: EffectQueue[] = []

   effectsComplete: EffectsComplete;
   protected emitEffectsComplete!: () => void;
   cancel!: () => void;

   constructor(
      public cycle: EffectCycle,
      protected phase: Phase,
      wrapTask: (fn?: (() => void) | null) => ((value: unknown) => void) | null = (fn) => () => {
         if (!fn) return;
         try {
            pushUpdate(this.cycle.update)
            fn()
         }
         catch (err) {
            catchCancelledUpdate(err)
         }
         finally {
            queueMicrotask(() => {
               popUpdate()
            })
         }
      }
   ) {
      this.effectsComplete = new EffectsComplete(new Promise<void>((resolve, reject) => {
         this.emitEffectsComplete = resolve
         this.cancel = reject
      }).catch(catchCancelledUpdate), wrapTask)
   }

   scheduleTask(task: () => void) {
      this.effectsComplete.then(task) // TODO: how do I run tasks as idle?
   }

   scheduleEffects(effects: EffectQueue) {
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

   runEffects(cycle: EffectCycle, onComplete: (resolve: Function) => void) {
      this.runBatches(
         (effect) => this.runEffect(effect),
         this.phase === SYNC ? undefined : new Set()
      )
      this.runMoreEffects(cycle, onComplete)
      return this.effectsComplete
   }

   runBatches(run: (effect: Effect) => void, completed: Set<Effect> | undefined) {
      const queues = this.effects;
      for (const batch of queues) {
         batch.runEffects(run, completed)
         batch.queued = this.moreEffects?.length ? batch.requeued : false;
         batch.requeued = false;
      }
   }

   runMoreEffects(cycle: EffectCycle, onComplete: (resolve: Function) => void) {
      this.effects = this.moreEffects ?? []
      this.moreEffects = undefined;
      if (this.effects.length) {
         this.runEffects(cycle, onComplete)
      }
      else {
         onComplete(this.emitEffectsComplete)
      }
   }

   runEffect(effect: Effect) {
      const update = this.cycle.update

      try {
         this.runningEffects = true
         pushUpdate(update)
         effect.run?.()
      }
      catch (err) {
         catchCancelledUpdate(err)
      }
      finally {
         popUpdate()
         this.runningEffects = false
      }
   }
}




/**
 * Belongs to the current effect cycle.
 */
export class PreludeTaskQueue extends TaskQueue {
   constructor(
      cycle: EffectCycle,
   ) {
      super(cycle, PRELUDE)
   }

   emitBatchesComplete: (() => void) | undefined
   idleCount = 0;

   override runEffects(cycle: EffectCycle, onComplete: (resolve: Function) => void) {
      new Promise<void>(emitBatchesComplete => {
         const update = this.cycle.update;
         this.runBatches(
            update.idle
               ? (effect: Effect) => { this.scheduleIdleEffect(effect, <number>update.idle) }
               : (effect: Effect) => { this.runEffect(effect) },
            new Set()
         )
         if (this.idleCount === 0) {
            emitBatchesComplete()
         }
         else {
            this.emitBatchesComplete = emitBatchesComplete
         }
      }).then(() => {
         this.runMoreEffects(cycle, onComplete)
      })
      return this.effectsComplete
   }

   scheduleIdleEffect(effect: Effect, timeout: number) {
      const update = this.cycle.update
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
      }, { timeout })
   }
}

function wrapTickTask(fn?: (() => void) | null) {
   return () => {
      if (!fn) return;
      tickUpdate(fn)
   }
}

// TODO: maybe make postlude distinct from tick?
/**
 * Belongs to the current effect cycle.
*/
export class TickTaskQueue extends TaskQueue {
   constructor(
      cycle: EffectCycle,
   ) {
      super(cycle, POSTLUDE, wrapTickTask)
   }

   emitBatchesComplete: (() => void) | undefined
   idleCount = 0;

   override runEffects(cycle: EffectCycle, onComplete: (resolve: Function) => void) {
      new Promise<void>(emitBatchesComplete => {
         this.runBatches(
            (effect: Effect) => { this.scheduleIdleEffect(effect) },
            new Set()
         )
         if (this.idleCount === 0) {
            emitBatchesComplete()
         }
         else {
            this.emitBatchesComplete = emitBatchesComplete
         }
      }).then(() => {
         this.runMoreEffects(cycle, onComplete)
      })
      return this.effectsComplete
   }

   scheduleIdleEffect(effect: Effect) {
      this.idleCount++;
      requestIdleCallback(() => {
         try {
            this.runningEffects = true
            wrapTickTask(effect.run)();
         }
         finally {
            this.runningEffects = false
            this.idleCount--
            if (this.idleCount === 0) {
               this.emitBatchesComplete?.()
            }
         }
      }, { timeout: 17 })
   }

   // override runEffect(effect: Effect) {
   //    try {
   //       this.runningEffects = true
   //       effect.run?.() // TODO: auto wrap with update??
   //    }
   //    finally {
   //       this.runningEffects = false
   //    }
   // }
}
