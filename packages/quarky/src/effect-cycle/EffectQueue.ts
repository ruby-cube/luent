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

   linked: boolean = false;

   isLinked(atom: WatchedAtom) {
      return this.atoms.has(atom)
   }

   link(atom: WatchedAtom) {
      if (this.isLinked(atom)) return;
      atom.link(this)
      this.linked = true;
      this.atoms.add(atom);
   }

   destroy() {
      this.fn = null;
      this.unlink()
   }

   unlink() {
      this.linked = false;
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
   
   if (__DEV__) oneoff.__DEV__fn = fn;

   return effect;
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

// 1) atom triggered
// 2) atom schedules all effects to appropriate


//TODO: [] Can I get rid of phase queue and go directly to effects?
export class EffectQueue {
   effects: Effect[] = []
   nextEffects: Effect[] | undefined

   runningEffects: boolean = false;

   // retained: Set<Effect> = new Set() // for sync effects

   constructor(private phase: Phase) {

   }

   runEffects() {
      this.runningEffects = true;
      const effects = this.effects
      const sync = this.phase === SYNC
      // const retained = sync ? this.retained : new Set()
      for (const effect of effects) {
         if (!effect.fn || effect.completed
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
            effectStack.push(effect); //TODO: if we don't care about infinite loops, this should be a counter
            effect.fn() // What about async tasks? T_T How will it affect this system?
         }
         finally {
            effectStack.pop()
            effect.completed = true;
            // if (retained.has(effect))
            //    continue;
            // this.retain(effect)
            // retained.add(effect)
         }
      }

      if (sync && effectStack.length !== 0) {
         return;
      }

      // reset queued status
      for (const effect of effects) {
         effect.queued = effect.requeued;
         effect.requeued = false;
         effect.completed = false;
      }

      this.effects = this.nextEffects ?? []
      this.nextEffects = undefined

      if (this.effects.length) {
         this.runEffects()
      }
      else {
         this.runningEffects = false;
      }
   }

   // retain(effect: Effect) {
   //    if (!effect.fn) return;
   //    const retainedEffects = this.nextEffects ?? (this.nextEffects = [])
   //    retainedEffects.push(effect)
   // }

   // /**
   // * To be called by watch() when initializing watcher
   // * @param effect 
   // */
   // queue(effect: Effect) {
   //    if (effect.isIn(this)) return;
   //    effect.addTo(this)

   //    if (this.runningEffects) {
   //       const nestedEffects = this.nextEffects ?? (this.nextEffects = [])
   //       nestedEffects.push(effect)
   //    }
   //    else {
   //       this.effects.push(effect)
   //    }
   // }

   scheduleEffect(effect: Effect) {
      if (this.runningEffects && !effect.requeued) {
         // a currentEffect during runningEffects means the effect triggered 
         // other effects and should be added to the effectStack to prevent infinite loops
         // const currentEffect = $currentEffect()
         // if (currentEffect) $currentEffectCycle().effectStack.add(currentEffect)
         effect.requeued = true;
         const extension = this.nextEffects ?? (this.nextEffects = [])
         extension.push(effect)
      }
      else if (!effect.queued) {
         this.effects.push(effect)
         effect.queued = true;
      }
   }
}



/**
 * Belongs to the current effect cycle.
 */
// export class _EffectQueue {
//    private extendedQueue: PhaseQueue[] | undefined;
//    private queue: PhaseQueue[] = []
//    private eagerQueue: PhaseQueue | undefined;

//    private taskQueue: PhaseQueue | undefined;


//    constructor(private phase: Phase) { }

//    scheduleTask(task: Effect) {
//       const taskQueue = this.taskQueue ?? (this.taskQueue = new PhaseQueue(this.phase))
//       taskQueue.queue(task)
//       this.scheduleEffects(taskQueue)
//    }

//    scheduleEagerEffect(effect: Effect) {
//       const eagerQueue = this.eagerQueue ?? (this.eagerQueue = new PhaseQueue(this.phase))
//       eagerQueue.queue(effect)
//       this.scheduleEffects(eagerQueue)
//    }

//    scheduleEffects(effects: PhaseQueue) {

//       if (this.runningEffects && !effects.requeued) {
//          // a currentEffect during runningEffects means the effect triggered 
//          // other effects and should be added to the effectStack to prevent infinite loops
//          // const currentEffect = $currentEffect()
//          // if (currentEffect) $currentEffectCycle().effectStack.add(currentEffect)
//          effects.requeued = true;
//          const extension = this.extendedQueue ?? (this.extendedQueue = [])
//          extension.push(effects)
//       }
//       else if (!effects.queued) {
//          this.queue.push(effects)
//          effects.queued = true;
//       }
//    }

//    private runningEffects: boolean = false

//    runEffects() {
//       this.runningEffects = true
//       // if (__debug__) debugger;
//       // this.runEagerEffects() //FIX: eager effects and tasks need to be integrated into the never ending effect cycle. Maybe schedule an eager effect atom and task atom
//       // PhaseBatch.runEffects

//       let completed: Set<Effect> = new Set()
//       const queue = this.queue;
//       for (const atom of queue) {
//          atom.runEffects(completed)
//          atom.queued = this.extendedQueue?.length ? atom.requeued : false;
//          atom.requeued = false;
//       }
//       this.queue = this.extendedQueue ?? []
//       this.extendedQueue = undefined;
//       if (this.queue.length) {
//          this.runEffects()
//       }

//       this.runningEffects = false;
//    }
// }
