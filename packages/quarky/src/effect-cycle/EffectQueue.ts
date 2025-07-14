import { Phase, SYNC } from "./EffectCycle";

type Task = (...args: any[]) => void

export class Effect {
   constructor(
      public task: Task | null,
   ) { }

   private phases: Set<PhaseEffects> = new Set()

   isIn(atom: PhaseEffects) {
      return this.phases.has(atom)
   }

   addTo(atom: PhaseEffects) {
      this.phases.add(atom)
   }

   destroy() {
      this.phases.clear()
      this.task = null;
   }

   remove() {
      this.phases.clear()
   }
}


const effectStack: Effect[] = []
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


export class PhaseEffects {
   effects: Effect[] = []
   nextEffects: Effect[] | undefined

   runningEffects: boolean = false;

   retained: Set<Effect> = new Set()

   constructor(private phase: Phase) {

   }

   // runSyncEffects() {
   //    this.runningEffects = true;
   //    const effects = this.effects

   //    const retained = this.retained

   //    for (const effect of effects) {
   //       if (!effect.task) { continue; }
   //       if (effectStack.has(effect)) {
   //          if (retained.has(effect))
   //             continue;
   //          this.retain(effect)
   //          retained.add(effect)
   //          console.warn('Infinite loop prevented. Prefer derivation ions over setting state in effects')
   //          continue;
   //       }
   //       try {
   //          effectStack.push(effect);
   //          effect.task() // What about async tasks? T_T How will it affect this system?
   //       }
   //       finally {
   //          effectStack.pop()
   //          if (retained.has(effect))
   //             continue;
   //          this.retain(effect)
   //          retained.add(effect)
   //       }
   //    }

   //    this.runningEffects = false;

   //    if (this.phase === SYNC && effectStack.size !== 0) {
   //       return;
   //    }
   //       this.effects = this.nextEffects ?? []
   //       this.retained.clear()
   //       this.nextEffects = undefined
   // }

   runEffects(completedEffects?: Set<Effect>) {
      this.runningEffects = true;
      const effects = this.effects
      const sync = this.phase === SYNC
      const retained = sync ? this.retained : new Set()
      for (const effect of effects) {
         if (!effect.task
            || completedEffects?.has(effect) // prevents repeats within queue (but not across extended queues and phases)
         ) {
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


      if (sync && effectStack.length !== 0) {
         return;
      }

      this.runningEffects = false;
      this.effects = this.nextEffects ?? []
      if (sync) this.retained.clear()
      this.nextEffects = undefined

      //     this.effects = this.nextEffects ?? []
      // this.retained.clear()
      // this.nextEffects = undefined
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
   queue(effect: Effect) {
      if (effect.isIn(this)) return;
      effect.addTo(this)

      if (this.runningEffects) {
         const nestedEffects = this.nextEffects ?? (this.nextEffects = [])
         nestedEffects.push(effect)
      }
      else {
         this.effects.push(effect)
      }
   }

   requeued: boolean = false;
   queued: boolean = false
}

let __debug__=false;
export function initDebugger(){
__debug__ = true
}

export class EffectQueue {
   private extendedQueue: PhaseEffects[] | undefined;
   private queue: PhaseEffects[] = []
   private eagerQueue: PhaseEffects | undefined;

   private taskQueue: PhaseEffects | undefined;


   constructor(private phase: Phase) { }

   scheduleTask(task: Effect) {
      const taskQueue = this.taskQueue ?? (this.taskQueue = new PhaseEffects(this.phase))
      taskQueue.queue(task)
      this.scheduleEffects(taskQueue)
   }

   scheduleEagerEffect(effect: Effect) {
      const eagerQueue = this.eagerQueue ?? (this.eagerQueue = new PhaseEffects(this.phase))
      eagerQueue.queue(effect)
      this.scheduleEffects(eagerQueue)
   }

   scheduleEffects(atom: PhaseEffects) {

      if (this.runningEffects && !atom.requeued) {
         // a currentEffect during runningEffects means the effect triggered 
         // other effects and should be added to the effectStack to prevent infinite loops
         // const currentEffect = $currentEffect()
         // if (currentEffect) $currentEffectCycle().effectStack.add(currentEffect)
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
      // if (__debug__) debugger;
      // this.runEagerEffects() //FIX: eager effects and tasks need to be integrated into the never ending effect cycle. Maybe schedule an eager effect atom and task atom
      // PhaseBatch.runEffects
      
      let completed: Set<Effect> = new Set()
      const queue = this.queue;
      for (const atom of queue) {
         atom.runEffects(completed)
         atom.queued = this.extendedQueue?.length ? atom.requeued : false;
         atom.requeued = false;
      }
      this.queue = this.extendedQueue ?? []
      this.extendedQueue = undefined;
      if (this.queue.length) {
         this.runEffects()
      }

      this.runningEffects = false;
   }

   // runEagerEffects() {
      
   //    const eagerEffects = this.eagerQueue
   //    if (!eagerEffects) return;
   //    for (const effect of eagerEffects) {
   //       if (!effect.task) {
   //          continue;
   //       }
   //       // stops infinite loops
   //       if (effectStack.has(effect)
   //          || $currentEffectCycle().effectStack.has(effect)
   //       ) {
   //          console.warn('Infinite loop prevented. Prefer derivation ions over setting state in effects')
   //          continue;
   //       }
   //       try {
   //          effectStack.push(effect);
   //          effect.task() // What about async tasks? T_T How will it affect this system?
   //       }
   //       finally {
   //          effectStack.pop()
   //       }
   //    }
   // }
}
