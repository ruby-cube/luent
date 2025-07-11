import { SYNC } from "./EffectCycle";
import { $currentEffectCycle } from "./ReactivitySystem";

//NOTE: scheduling nested effects into nextQueue is broken

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

   queued: boolean = false
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


export class EffectQueue {
   private atoms: PhaseAtom[] = []

   addAtom(atom: PhaseAtom) {
      this.atoms.push(atom)
   }

   constructor(private phase: string | typeof SYNC) {

   }

   private releaseAtoms() {
      const atoms = this.atoms
      for (const atom of atoms) {
         atom.releaseTrigger()
      }
      this.atoms = []
   }

   private activeQueue: Effect[] | undefined
   private triggeredQueue: Effect[] = []
   private nextQueue: Set<Effect> | undefined;

   private eagerQueue: Effect[] | undefined;

   scheduleEagerEffect(effect: Effect) {
      if (this.runningEffects) {
         return this.scheduleNestedEffect(effect)
      }
      if (effect.queued) return;
      const eagerQueue = this.eagerQueue ?? (this.eagerQueue = [])
      eagerQueue.push(effect)
      effect.queued = true;
   }

   scheduleEffect(effect: Effect) {
      if (effect.queued) return;
      this.triggeredQueue.push(effect)
      effect.queued = true;
   }

   scheduleNestedEffect(effect: Effect) {
      const nested = this.nextQueue ?? (this.nextQueue = new Set())
      if (nested.has(effect)) return;
      nested.add(effect)
   }

   runningEffects: boolean = false;

   runTriggeredEffects() {
      this.activeQueue = this.triggeredQueue
      this.runEffects()
   }

   private runEffects() {
      const effects = this.activeQueue
      if (!effects) return;
      this.runningEffects = true;
      console.log('%%% -- effects:', effects.length)
      for (const effect of effects) {
         if (!effect.task) continue;

         // stops infinite loops
         if (effectStack.has(effect) || $currentEffectCycle().effectStack.has(effect)) {
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

      if (this.phase === SYNC && effectStack.size !== 0) return;

      this.activeQueue = this.nextQueue ? Array.from(this.nextQueue) : undefined
      this.nextQueue = undefined;
      try {
         if (this.activeQueue) {
            this.runEffects()
         }
      }
      finally {
         this.runningEffects = false;
         this.dequeueEffects()
         this.releaseAtoms()
         this.activeQueue = undefined
      }
   }

   runEagerEffects() {
      this.activeQueue = this.eagerQueue;
      this.runEffects()
   }

   dequeueEffects() {
      const effects = this.activeQueue;
      if (!effects)return;
      for (const effect of effects) {
         effect.queued = false;
      }
   }
}




export class PhaseAtom {

   private triggered: boolean = false
   private currentQueue: EffectQueue | undefined; // undefined if not triggered

   private effects: Effect[] = []
   private untriggeredEffects: Effect[] | undefined;

   constructor(phase: string) {
      this.scheduleEffects = phase === SYNC ? this.queueSyncEffects : this.queueEffects
   }

   /**
   * To be called by watch() when initializing watcher
   * @param effect 
   */
   link(effect: Effect) {
      if (this.triggered) {
         const untriggered = this.untriggeredEffects ?? (this.untriggeredEffects = [])
         untriggered.push(effect)
      }

      if (effect.isLinked(this)) {
         return;
      }

      effect.link(this)
      this.effects.push(effect)
   }

   scheduleEffects: (queue: EffectQueue) => void

   private queueSyncEffects(queue: EffectQueue) {
      this.queueEffects(queue)
      queue.runTriggeredEffects()
   }

   private queueEffects(queue: EffectQueue) {
      if (this.triggered) {
         if (!this.untriggeredEffects) return;
         this._queueEffects(this.untriggeredEffects, queue)
         return;
      }
      this.markTriggered(queue)
      queue.addAtom(this)

      this._queueEffects(this.effects, queue)
   }

   private markTriggered(queue: EffectQueue) {
      this.triggered = true;
      this.currentQueue = queue;
   }

   releaseTrigger() {
      this.triggered = false;
      this.currentQueue = undefined

      // remove cancelled effects
      const retained = []
      const effects = this.effects
      for (const effect of effects) {
         if (!effect.task) continue;
         retained.push(effect)
      }
      this.effects = retained;
      this.untriggeredEffects = undefined;
   }

   private _queueEffects(effects: Effect[], queue: EffectQueue) {
      for (const effect of effects) {
         this.currentQueue?.runningEffects ? queue.scheduleNestedEffect(effect) : queue.scheduleEffect(effect)
      }
   }
}



