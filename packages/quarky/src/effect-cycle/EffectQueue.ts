import { unnestOriginalFn } from "@rue/utils";
import { WatchedAtom } from "../watch/WatchedAtom";
import { Phase, SYNC } from "./EffectCycle";

type TaskFn = (...args: any[]) => void

// export class Effect {
//    constructor(
//       public fn: TaskFn | null,
//    ) { }

//    private phases: Set<PhaseQueue> = new Set()

//    isIn(atom: PhaseQueue) {
//       return this.phases.has(atom)
//    }

//    addTo(atom: PhaseQueue) {
//       this.phases.add(atom)
//    }

//    destroy() {
//       this.phases.clear()
//       this.fn = null;
//    }

//    remove() {
//       this.phases.clear()
//    }
// }

export class Effect {
   constructor(
      public fn: TaskFn | null,
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
      this.active = true;
      this.atoms.add(atom);
   }

   destroy() {
      this.fn = null;
      this.unlink()
   }

   unlink() {
      this.active = false;
      if (this.requeued) console.warn('unlinking requeued effect')
      if (this.queued) console.warn('unlinking queued effect')
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
   effect.fn = oneoff
   effect.active = true;

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
   effects: Effect[] = []
   nextEffects: Effect[] | undefined

   runningEffects: boolean = false;

   retained: Set<Effect> = new Set()

   constructor(
      private phase: Phase,
   ) {

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
         if (!effect.fn
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
            // effectStack.push(effect);
            effectStackCount++
            effect.fn() // What about async tasks? T_T How will it affect this system?
         }
         finally {
            effectStackCount--
            // effectStack.pop()
            completedEffects?.add(effect)
            if (retained.has(effect))
               continue;
            this.retain(effect)
            retained.add(effect)
         }
      }


      if (sync && effectStackCount !== 0) {
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
      if (!effect.fn) return;
      const retainedEffects = this.nextEffects ?? (this.nextEffects = [])
      retainedEffects.push(effect)
   }

   /**
   * To be called by watch() when initializing watcher
   * @param effect 
   */
   queue(effect: Effect) {
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

// 1) atom triggered
// 2) atom schedules all effects to appropriate


//TODO: [] Can I get rid of phase queue and go directly to effects?
// export class _EffectQueue {
//    effects: Effect[] = []
//    nextEffects: Effect[] | undefined

//    runningEffects: boolean = false;

//    // retained: Set<Effect> = new Set() // for sync effects

//    constructor(private phase: Phase) {

//    }

//    runEffects() {
//       this.runningEffects = true;
//       const effects = this.effects

//       for (const effect of effects) {
//          if (!effect.fn || effect.completed || !effect.active) {
//             continue;
//          }

//          try {
//             // effectStackCount++
//             effect.fn() // What about async tasks? T_T How will it affect this system?
//          }
//          finally {
//             // effectStackCount--
//             effect.completed = true;
//          }
//       }

//       // if (sync && effectStackCount !== 0) { //QUESTION: do we need to reset completion state for sync effects?
//       //    return;
//       // }

//       // const nextEffects = this.nextEffects ?? []

//       // reset queued status
//       for (const effect of effects) {
//          effect.queued = this.nextEffects?.length ? effect.requeued : false;
//          effect.requeued = false;
//          effect.completed = false;
//       }
//       this.effects = this.nextEffects ?? []
//       this.nextEffects = undefined

//       if (this.effects.length) {
//          this.runEffects()
//       }
//       else {
//          this.runningEffects = false;
//       }
//    }

//    scheduleEffect(effect: Effect) {
//       if (this.runningEffects && !effect.requeued) {
//          // a currentEffect during runningEffects means the effect triggered 
//          // other effects and should be added to the effectStack to prevent infinite loops
//          // const currentEffect = $currentEffect()
//          // if (currentEffect) $currentEffectCycle().effectStack.add(currentEffect)
//          effect.requeued = true;
//          const extension = this.nextEffects ?? (this.nextEffects = [])
//          extension.push(effect)
//       }
//       else if (!effect.queued) {
//          this.effects.push(effect)
//          effect.queued = true;
//       }
//    }
// }




/**
 * Belongs to the current effect cycle.
 */
export class EffectQueue {
   private moreQueues: PhaseQueue[] | undefined;
   private queues: PhaseQueue[] = []

   private taskQueue: PhaseQueue | undefined; //TODO: need to run

   constructor(private phase: Phase) { }

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

   runEffects() {
      this.runningEffects = true
      
      let completed: Set<Effect> = new Set()
      const queues = this.queues;
      for (const batch of queues) {
         batch.runEffects(completed)
         batch.queued = this.moreQueues?.length ? batch.requeued : false;
         batch.requeued = false;
      }

      this.queues = this.moreQueues ?? []
      this.moreQueues = undefined;
      if (this.queues.length) {
         this.runEffects()
      }

      this.runningEffects = false;
   }
}
