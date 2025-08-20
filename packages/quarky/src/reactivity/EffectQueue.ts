import { __DEV__unwrap } from "@rue/utils";
import { WatchedAtom } from "./WatchedAtom";
import { UpdateCycle, Phase, SYNC, popUpdate, pushUpdate } from "./UpdateCycle";

// const PRERENDER = 0 //QUESTION: Should UpdateCycle and EffectQueue belong to Lumo also??

type TaskFn = (...args: any[]) => unknown


export class Effect {
   running = false
   constructor(
      public run: TaskFn | null,
      public phase: Phase
   ) { }

   private atoms: Set<WatchedAtom> = new Set()

   active: boolean = false;

   isLinked(atom: WatchedAtom) {
      return this.atoms.has(atom)
   }

   link(atom: WatchedAtom) {
      if (this.isLinked(atom)) return;
      atom.link(this)
      this.atoms.add(atom);
   }

   destroy() {
      this.run = null;
      this.unlinkAtoms()
   }

   unlink(atom: WatchedAtom) {
      if (!this.isLinked(atom)) return;
      this.requeued = false; //QUESTION: not sure if this is necessary
      this.atoms.delete(atom)
   }

   //FIX: unlinking needs to remove effect from the atom's phase queue
   unlinkAtoms() {
      this.requeued = false;
      // this.queued = false;
      this.atoms.clear()
   }

   completed: boolean = false;
   requeued: boolean = false;
   queued: boolean = false;
}

/**
 * Tasks that run only once
 * @param fn 
 * @returns 
 */
export function createOneoff(fn: () => void, phase: Phase) {
   const effect = new Effect(fn, phase);
   const oneoff = () => {
      fn();
      effect.destroy()
   }
   effect.run = oneoff

   if (__DEV__) oneoff.__DEV__fn = fn;

   return effect;
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


export class PhaseQueue {
   effects: Effect[] | undefined;
   nextEffects: Effect[] = []

   // runningEffects: boolean = false;

   retained: Set<Effect> = new Set() // for sync effects
   canLaze: boolean | undefined = undefined


   constructor(
      private phase: Phase,
      private atom?: WatchedAtom
   ) {
   }

   runEffects(cycle: UpdateCycle, completed: Set<Effect> | undefined) {
      const promises: Promise<unknown>[] = []
      const effects = this.nextEffects
      this.nextEffects = []
      const phases = cycle.phases
      const phase = this.phase
      const sync = phase === SYNC
      const canLaze = this.canLaze !== undefined ? this.canLaze : phases.length - 1 !== phase && !sync && phases[phase].canLaze

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
            if (canLaze && cycle.update.lazy) {
               cycle.preupdateCount++;
               const promise = new Promise((resolve) => {
                  requestIdleCallback(() => {
                     let _promise;
                     const update = cycle.update
                     try {
                        pushUpdate(update)
                        _promise = effect.run?.();
                     }
                     finally {
                        popUpdate()
                        if (_promise instanceof Promise) _promise.then(resolve)
                        else resolve(undefined)
                        cycle.preupdateCount--
                        if (cycle.preupdateCount === 0) {
                           cycle.resolvePreupdate?.(cycle.lazyResult) //TODO: need to wait till all promises resolve
                        }
                     }
                  }, { timeout: 17/* TODO: prioritize based on time margin */ })
               })
               promises.push(promise)
            }
            else {
               const promise = effect.run() // What about async tasks? T_T How will it affect this system?
               if (promise instanceof Promise) promises.push(promise)
            }
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
      return !sync && promises.length ? Promise.allSettled(promises) : undefined;
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



/**
 * Belongs to the current effect cycle.
 */
export class EffectQueue {
   private moreQueues: PhaseQueue[] | undefined;
   private queues: PhaseQueue[] = []

   private taskQueue: PhaseQueue | undefined; //TODO: need to run

   constructor(
      public cycle: UpdateCycle,
      private phase: Phase
   ) {

   }

   scheduleEffect(task: Effect) {
      const taskQueue = this.taskQueue ?? (this.taskQueue = new PhaseQueue(this.phase))
      taskQueue.queue(task)
      this.scheduleEffects(taskQueue)
   }

   scheduleEffects(effects: PhaseQueue) {

      if (this.runningEffects && !effects.requeued) {
         // a currentEffect during runningEffects means the effect triggered 
         // other effects and should be added to the effectStack to prevent infinite loops
         // const currentEffect = $currentEffect()
         // if (currentEffect) $currentEffectCycle().effectStack.add(currentEffect)
         effects.requeued = true;
         const extension = this.moreQueues ?? (this.moreQueues = [])
         extension.push(effects)
      }
      else if (!effects.queued) {
         this.queues.push(effects)
         effects.queued = true;
      }
   }

   private runningEffects: boolean = false

   runEffects(cycle: UpdateCycle) {
      this.runningEffects = true

      const pendingPreupdate = cycle.pendingPreupdate;
      const promises: Promise<unknown>[] = pendingPreupdate ? [pendingPreupdate] : []

      const completed: Set<Effect> | undefined = this.phase === SYNC ? undefined : new Set()
      const queues = this.queues;
      for (const batch of queues) {
         const promise = batch.runEffects(cycle, completed)
         if (promise) promises.push(promise)
         batch.queued = this.moreQueues?.length ? batch.requeued : false;
         batch.requeued = false;
      }

      this.queues = this.moreQueues ?? []
      this.moreQueues = undefined;
      if (this.queues.length) {
         const promise = this.runEffects(cycle)
         if (promise) promises.push(promise)
      }

      this.runningEffects = false;
      return promises.length ? Promise.allSettled(promises) : undefined
   }
}
