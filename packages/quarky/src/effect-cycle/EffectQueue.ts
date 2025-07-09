// watched queues
// need to add and remove easily: set

import { TaskQueue, TaskRef } from "./TaskQueue";
import { $currentEffectCycle } from "../ReactivitySystem";


// effect cycle queues
// need to iterate efficiently: array

type Task = (...args: any[]) => void

export class Effect {
   constructor(
      public task: Task | null,
   ) { }

   private atoms: Set<WatchedAtom> = new Set()

   isLinked(atom: WatchedAtom) {
      return this.atoms.has(atom)
   }

   link(atom: WatchedAtom) {
      this.atoms.add(atom)
   }

   unlink(atom: WatchedAtom) {
      this.atoms.delete(atom)
      this.task = null;
   }
}





const _effectStack: Effect[] = []
const activeEffects = new Set()

export function $currentEffect() {
   return _effectStack.at(-1)
}

export const effectStack = {
   get size(){
      return activeEffects.size;
   },
   has(effect: Effect) {
      return activeEffects.has(effect)
   },

   push(effect: Effect) {
      activeEffects.add(effect)
      _effectStack.push(effect)
   },

   pop() {
      const effect = _effectStack.pop()
      activeEffects.delete(effect)
   }
}


export class WatchedAtom {
   nestedEffects: Effect[] | undefined
   effects: Effect[] = []
   retainedEffects: Effect[] | undefined

   runningEffects: boolean = false;

   get effectChain() {
      const effectChains = $currentEffectCycle().effectChains
      const effectChain = effectChains.get(this);
      if (effectChain) return effectChain;
      const chain: Set<Effect> = new Set();
      effectChains.set(this, chain)
      return chain;
   }

   retained: Set<Effect> = new Set()

   runSyncEffects() {
      this.runningEffects = true;
      const effects = this.effects
      console.log('watchedAtom.runEffects::', effects.length)
      console.log('retained effects?????', this.retainedEffects?.length)

      const retained = this.retained

      for (const effect of effects) {
         if (!effect.task || effectStack.has(effect)) {
            console.log('** effectStack.has(effect)', effectStack.has(effect))
            if (!retained.has(effect)) {
               this.retain(effect)
               retained.add(effect)
            }
            continue;
         }
         try {
            effectStack.push(effect);
            effect.task() // What about async tasks? T_T How will it affect this system?
         }
         finally {
            effectStack.pop()
            if (!retained.has(effect)) {
               this.retain(effect)
               retained.add(effect)
            }
         }
      }

      this.runningEffects = false;
      console.log('retained::', this.retainedEffects?.length)
      console.log('nested::', this.nestedEffects?.length)

      if (effectStack.size === 0){
         this.effects = [...(this.retainedEffects ?? []), ...(this.nestedEffects ?? [])]
         this.retained.clear()
         this.retainedEffects = undefined
         this.nestedEffects = undefined;
      }
   }

   runEffects(completedEffects?: Set<Effect>) {
      this.runningEffects = true;
      const effects = this.effects
      console.log('watchedAtom.runEffects::', effects.length)
      console.log('completedEffects', completedEffects)
      console.log('retained effects?????', this.retainedEffects?.length)

      const retained = new Set()

      for (const effect of effects) {
         if (!effect.task
            || effectStack.has(effect)
            || completedEffects?.has(effect) // prevents repeats
            || this.effectChain.has(effect) // prevents infinite loops
         ) {
            console.log('** effectStack.has(effect)', effectStack.has(effect))
            console.log('** completedEffects.has(effect)', completedEffects?.has(effect))
            console.log('** effectChain.has(effect)', this.effectChain.has(effect))
            if (!retained.has(effect)) {
               this.retain(effect)
               retained.add(effect)
            }
            continue;
         }
         try {
            effectStack.push(effect);
            effect.task() // What about async tasks? T_T How will it affect this system?
         }
         finally {
            effectStack.pop()
            completedEffects?.add(effect)
            if (!retained.has(effect)) {
               this.retain(effect)
               retained.add(effect)
            }
         }
      }

      this.runningEffects = false;
      console.log('retained::', this.retainedEffects?.length)
      console.log('nested::', this.nestedEffects?.length)

      this.effects = [...(this.retainedEffects ?? []), ...(this.nestedEffects ?? [])]
      this.retainedEffects = undefined
      this.nestedEffects = undefined;
   }

   retain(effect: Effect) {
      if (!effect.task) return;
      console.log('>retained effect', this.retainedEffects?.length)
      const retainedEffects = this.retainedEffects ?? (this.retainedEffects = [])
      retainedEffects.push(effect)
   }

   /**
   * To be called by watch() when initializing watcher
   * @param effect 
   */
   link(effect: Effect) {
      console.log('link?')
      if (effect.isLinked(this)) return;
      console.log('link')
      effect.link(this)

      if (this.runningEffects) {
         const nested = this.nestedEffects ?? (this.nestedEffects = [])
         nested.push(effect)
      }
      else {
         console.log('push into effects')
         // if (this.retainedEffects) {
         //    this.effects = this.retainedEffects
         //    this.retainedEffects = undefined;
         // }
         this.effects.push(effect)
      }
   }

   /**
    * To be called by watcher's stop() function
    * @param effect 
    */
   unlink(effect: Effect) {
      effect.unlink(this)
   }

   requeued: boolean = false;
   queued: boolean = false
}


export class EffectQueue {
   private extendedQueue: WatchedAtom[] | undefined;
   private queue: WatchedAtom[] = []
   private eagerQueue: Effect[] | undefined;
   private taskQueue: TaskQueue | undefined;

   scheduleTask(task: TaskRef) {
      this.taskQueue?.scheduleTask(task)
   }

   scheduleEagerEffect(effect: Effect) {
      const eagerQueue = this.eagerQueue ?? (this.eagerQueue = [])
      eagerQueue.push(effect)
   }

   scheduleEffects(atom: WatchedAtom) {
      const currentEffect = $currentEffect()
      if (currentEffect) {
         atom.effectChain.add(currentEffect)
      }

      console.log('effectQueue.scheduleEffects')
      if (this.runningEffects && !atom.requeued) { //TODO: is the requeued correct??
         atom.requeued = true;
         const extension = this.extendedQueue ?? (this.extendedQueue = [])
         extension.push(atom)
      }
      else if (!atom.queued) {
         this.queue.push(atom)
         atom.queued = true;
      }
   }

   private runningEffects: boolean = false

   runEffects() {

      this.runningEffects = true
      let completed: Set<Effect> = new Set()
      this.runEagerEffects()

      const queue = this.queue;
      for (const atom of queue) {
         atom.runEffects(completed)
         atom.queued = atom.requeued;
         atom.requeued = false;
      }
      this.queue = this.extendedQueue ?? []
      this.extendedQueue = undefined;
      if (this.queue.length) {
         console.log('EXTENDING', this.queue.length)
         this.runEffects()
      }

      this.runningEffects = false;
   }

   private runEagerEffects() {
      const eagerEffects = this.eagerQueue
      if (!eagerEffects) return;
      for (const effect of eagerEffects) {
         effect.task?.()
      }
   }

   // runSyncEffects() {
   //    for (const effect of this.effects) {
   //       if (effectStack.has(effect)) {
   //          console.log('infinite loop prevented')
   //          continue; // prevents infinite loops
   //       }
   //       effectStack.push(effect)
   //       try {
   //          effect.task()
   //       }
   //       finally {
   //          effectStack.pop()
   //          if (!effect.vine) continue; // effect has already been removed during the effect via 'once' or 'scheduler'
   //          effect.watchSubject!.effects.addToVine(effect, SYNC) // return to watch subject
   //       }
   //    }
   // }
}

// type Phase = 'sync' | 'preupdate' | 'update' | 'postupdate' | 'lazy'
// postupdate phase is for updates that you want to happen within 100ms

// class EffectCycle {
//    effects: Map<Phase, EffectQueue> = new Map()

//    scheduleEffects(atom: WatchedAtom, phase: Phase) {
//       if (phase === 'lazy') {
//          const lazyPhase = getLazyPhase()
//          lazyPhase.scheduleEffects(atom as LazyWatchedAtom)
//          return;
//       }
//       let q;
//       const cyclePhase = this.effects.get(phase) ?? (this.effects.set(phase, q = new EffectQueue()), q)
//       cyclePhase.scheduleEffects(atom)
//    }
// }
