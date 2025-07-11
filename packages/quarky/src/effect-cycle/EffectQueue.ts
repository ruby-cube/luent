import { SYNC } from "./EffectCycle";
import { $currentEffectCycle } from "./ReactivitySystem";

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

   destroy() {
      this.atoms.clear()
      this.task = null;
   }

   unlink() {
      this.atoms.clear()
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
   effects: Effect[] = []
   nextEffects: Effect[] | undefined

   runningEffects: boolean = false;

   retained: Set<Effect> = new Set()

   constructor(private phase: string | typeof SYNC) {

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
      if (sync) console.log('running SYNC')
      const retained = sync ? this.retained : new Set()
      console.log('%%% -- effects:', effects.length)
      for (const effect of effects) {
         if (!effect.task
            || completedEffects?.has(effect) // prevents repeats within queue (but not across extended queues and phases)
         ) {
            if (!effect.task) console.log('%%% EMPTY EFFECT')
            if (completedEffects?.has(effect)) console.log('%%% EMPTY EFFECT')
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


      if (sync && effectStack.size !== 0) {
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

   requeued: boolean = false;
   queued: boolean = false
}



export class EffectQueue {
   private extendedQueue: PhaseAtom[] | undefined;
   private queue: PhaseAtom[] = []
   private eagerQueue: Effect[] | undefined;

   constructor(phase: string) { }

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
      this.runEagerEffects()
      
      let completed: Set<Effect> = new Set()
      const queue = this.queue;
      console.log('%%% -- atoms:', queue.length)
      for (const atom of queue) {
         atom.runEffects(completed)
         atom.queued = this.extendedQueue?.length ? atom.requeued : false;
         atom.requeued = false;
      }
      this.queue = this.extendedQueue ?? []
      this.extendedQueue = undefined;
      if (this.queue.length) {
         console.log('%%% -- more atoms', this.queue.length)
         this.runEffects()
      }

      this.runningEffects = false;
   }

   runEagerEffects() {
      const eagerEffects = this.eagerQueue
      if (!eagerEffects) return;
      for (const effect of eagerEffects) {
         if (!effect.task) {
            continue;
         }
         // stops infinite loops
         if (effectStack.has(effect)
            || $currentEffectCycle().effectStack.has(effect)
         ) {
            console.warn('Infinite loop prevented. Prefer derivation ions over setting state in effects')
            continue;
         }
         try {
            effectStack.push(effect);
            effect.task() // What about async tasks? T_T How will it affect this system?
         }
         finally {
            effectStack.pop()
         }
      }
   }
}
