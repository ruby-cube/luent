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

   private atoms: Set<PhaseAtom> = new Set()

   isLinked(atom: PhaseAtom) {
      return this.atoms.has(atom)
   }

   link(atom: PhaseAtom) {
      this.atoms.add(atom)
   }

   unlink(atom: PhaseAtom) {
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
   get size() {
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


export class PhaseAtom {
   // nestedEffects: Effect[] | undefined
   effects: Effect[] = []
   nextEffects: Effect[] | undefined

   runningEffects: boolean = false;

   // get effectChain() {
   //    const effectChains = $currentEffectCycle().effectChains
   //    const effectChain = effectChains.get(this);
   //    if (effectChain) return effectChain;
   //    const chain: Set<Effect> = new Set();
   //    effectChains.set(this, chain)
   //    return chain;
   // }

   retained: Set<Effect> = new Set()

   runSyncEffects() {
      this.runningEffects = true;
      const effects = this.effects

      const retained = this.retained

      for (const effect of effects) {
         if (!effect.task) { continue; }
         if (effectStack.has(effect)) {
            if (retained.has(effect))
               continue;
            this.retain(effect)
            retained.add(effect)
            console.warn('Infinite loop prevented. Prefer derivation ions over setting state in effects')
            continue;
         }
         try {
            effectStack.push(effect);
            effect.task() // What about async tasks? T_T How will it affect this system?
         }
         finally {
            effectStack.pop()
            if (retained.has(effect))
               continue;
            this.retain(effect)
            retained.add(effect)
         }
      }

      this.runningEffects = false;

      if (effectStack.size === 0) {
         this.effects = this.nextEffects ?? []
         // this.nestedEffects ? this.retainedEffects ?
         //    [...this.retainedEffects, ...this.nestedEffects]
         //    : this.nestedEffects : this.retainedEffects ?? []
         this.retained.clear()
         this.nextEffects = undefined
         // this.nestedEffects = undefined;
      }
   }

   runEffects(completedEffects?: Set<Effect>) {
      this.runningEffects = true;
      const effects = this.effects

      const retained = new Set()

      for (const effect of effects) {
         if (!effect.task
            || completedEffects?.has(effect) // prevents repeats within queue (but not across extended queues and phases)
         ) {
            continue;
         }
         // stops infinite loops
         if (effectStack.has(effect)
            || $currentEffectCycle().effectStack.has(effect)
         ) {
            if (retained.has(effect))
               continue;
            this.retain(effect)
            retained.add(effect)

            console.warn('Infinite loop prevented. Prefer derivation ions over setting state in effects')
            continue;
         }
         try {
            effectStack.push(effect);
            effect.task() // What about async tasks? T_T How will it affect this system?
         }
         finally {
            effectStack.pop()
            completedEffects?.add(effect)
            if (retained.has(effect))
               continue;
            this.retain(effect)
            retained.add(effect)

         }
      }

      this.runningEffects = false;
      // console.log('$$$ Nested???', this.nestedEffects?.length)
      this.effects = this.nextEffects ?? []
      // this.effects = this.nestedEffects ? this.retainedEffects ?
      //    [...this.retainedEffects, ...this.nestedEffects]
      //    : this.nestedEffects : this.retainedEffects ?? []

      this.nextEffects = undefined
      // this.nestedEffects = undefined;
   }

   retain(effect: Effect) {
      if (!effect.task) return;
      const retainedEffects = this.nextEffects ?? (this.nextEffects = [])
      retainedEffects.push(effect)
   }

   /**
   * To be called by watch() when initializing watcher
   * @param effect 
   */
   link(effect: Effect) {
      if (effect.isLinked(this)) return;
      effect.link(this)

      if (this.runningEffects) {
         const nestedEffects = this.nextEffects ?? (this.nextEffects = [])
         nestedEffects.push(effect)
      }
      else {
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
   private extendedQueue: PhaseAtom[] | undefined;
   private queue: PhaseAtom[] = []
   private eagerQueue: Effect[] | undefined;
   // private taskQueue: TaskQueue | undefined;

   // scheduleTask(task: TaskRef) {
   //    const taskQueue = this.taskQueue ?? (this.taskQueue = new TaskQueue())
   //    taskQueue.scheduleTask(task)
   // }

   scheduleEagerEffect(effect: Effect) {
      const eagerQueue = this.eagerQueue ?? (this.eagerQueue = [])
      eagerQueue.push(effect)
   }

   scheduleEffects(atom: PhaseAtom) {

      if (this.runningEffects && !atom.requeued) {
         // a currentEffect during runningEffects means the effect triggered 
         // other effects and should be added to the effectStack to prevent infinite loops
         const currentEffect = $currentEffect()
         if (currentEffect) $currentEffectCycle().effectStack.add(currentEffect)
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
      console.log('runEffects', queue.length)
      for (const atom of queue) {
         atom.runEffects(completed)
         atom.queued = this.extendedQueue?.length ? atom.requeued : false;
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

   // runTasks() {
   //    const tasks = this.taskQueue;
   //    if (!tasks) return;
   //    tasks.runTasks()
   // }

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

//    scheduleEffects(atom: PhaseAtom, phase: Phase) {
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
