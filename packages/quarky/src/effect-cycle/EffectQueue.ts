// watched queues
// need to add and remove easily: set

import { queueTask } from "@rue/thread";


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




export class WatchedAtom {
   extendedEffects: Effect[] | undefined
   effects: Effect[] = []
   retainedEffects: Effect[] | undefined

   runningEffects: boolean = false;

   runEffects() {
      this.runningEffects = true;
      const effects = this.effects

      for (const effect of effects) {
         if (effect.task) {
            effect.task() // What about async tasks? T_T How will it affect this system?
            this.retain(effect)
         }
      }
      this.runningEffects = false;

      this.effects = this.extendedEffects ?? []
      this.extendedEffects = undefined;
   }

   retain(effect: Effect) {
      if (!effect.task) return;
      const retainedEffects = this.retainedEffects ?? (this.retainedEffects = [])
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
         const extension = this.extendedEffects ?? (this.extendedEffects = [])
         extension.push(effect)
      }
      else {
         if (this.retainedEffects) {
            this.effects = this.retainedEffects
            this.retainedEffects = undefined;
         }
         this.effects.push(effect)
      }
   }

   // /**
   //  * To be called by watcher's stop() function
   //  * @param effect 
   //  */
   // unlink(effect: Effect) {
   //    effect.unlink(this)
   //    effect.task = null;
   // }

   requeued: boolean = false;
   queued: boolean = false
}


export class EffectQueue {
   private extendedQueue: WatchedAtom[] | undefined;
   private queue: WatchedAtom[] = []
   private eagerQueue: Effect[] | undefined;

   scheduleEagerEffect(effect: Effect) {
      const eagerQueue = this.eagerQueue ?? (this.eagerQueue = [])
      eagerQueue.push(effect)
   }

   scheduleEffects(atom: WatchedAtom) {
      if (this.runningEffects && !atom.requeued) {
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

   runEffects() { //QUESTION: can infinite loop protect be implemented here?
      this.runningEffects = true

      this.runEagerEffects()

      const queue = this.queue;
      for (const atom of queue) {
         atom.runEffects()
         atom.queued = atom.requeued;
         atom.requeued = false;
      }
      this.queue = this.extendedQueue ?? []
      this.extendedQueue = undefined;
      if (this.queue.length) {
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

   runSyncEffects() {
      for (const effect of this.effects) {
         if (effectStack.has(effect)) {
            console.log('infinite loop prevented')
            continue; // prevents infinite loops
         }
         effectStack.push(effect)
         try {
            effect.task()
         }
         finally {
            effectStack.pop()
            if (!effect.vine) continue; // effect has already been removed during the effect via 'once' or 'scheduler'
            effect.watchSubject!.effects.addToVine(effect, SYNC) // return to watch subject
         }
      }
   }
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

function calcIdleDeadline(startTime: DOMHighResTimeStamp, responseTime: number) {
   const now = new Performance().now()
   const elapsed = now - startTime;
   const deadline = responseTime - elapsed
   return deadline < 0 ? 0 : deadline;
}

class LazyWatchedAtom extends WatchedAtom {
   constructor(
      public responseTime?: number
   ) {
      super()
   }
   startTime?: DOMHighResTimeStamp
   currentIndex = 0
   resolve: ((value: void | PromiseLike<void>) => void) | undefined
   override runEffects(): void | Promise<void> {
      this.runningEffects = true;
      const effects = this.effects
      if (this.responseTime && this.startTime === undefined) this.startTime = new Performance().now()
      for (let i = this.currentIndex; i < effects.length; i++) {
         if (timeLeft < 1) {
            this.currentIndex = i;
            if (this.responseTime) {
               const deadline = calcIdleDeadline(this.startTime!, this.responseTime)
               if (deadline === 0) queueTask(() => this.runEffects())
               else requestIdleCallback(() => this.runEffects(), { timeout: deadline })
            }
            else {
               requestIdleCallback(() => this.runEffects())
            }

            return new Promise((resolve) => {
               this.resolve = resolve
            })
         }
         else {
            const effect = effects[i]
            if (effect.task) {
               effect.task() // What about async tasks? T_T How will it affect this system?
               this.retain(effect)
            }
         }
      }
      this.runningEffects = false;

      this.effects = this.extendedEffects ?? []
      this.extendedEffects = undefined;
      if (this.resolve) this.resolve()
   }
}


// a queue that runs synchronously until the next animation frame where it will pause execution and continue after animation frame complete (onIdle)

class LazyEffectPhase implements EffectQueue {
   constructor() {
      startFrameTracker()
   }

   private extendedQueue: LazyWatchedAtom[] | undefined;
   private queue: LazyWatchedAtom[] = []

   scheduleEffects(atom: LazyWatchedAtom) {
      if (this.runningEffects && !atom.requeued) {
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
   currentIndex = 0;

   async runEffects() {
      this.runningEffects = true
      const queue = this.queue;
      for (let i = this.currentIndex; i < queue.length; i++) {
         if (timeLeft < 1) {
            this.currentIndex = i;
            requestIdleCallback(() => this.runEffects())
            return;
         }
         else {
            const atom = queue[i]
            const resume = atom.runEffects()
            if (resume) {
               await resume;
               atom.queued = atom.requeued;
               atom.requeued = false;
            }
            else {
               atom.queued = atom.requeued;
               atom.requeued = false;
            }
         }
      }
      this.queue = this.extendedQueue ?? []
      this.extendedQueue = undefined;
      if (this.queue.length) {
         await this.runEffects()
         this.runningEffects = false;
         this.currentIndex = 0
      }
      else {
         this.runningEffects = false;
         this.currentIndex = 0
      }
   }
}

let lazyPhase = new LazyEffectPhase()

function getLazyPhase() {
   return lazyPhase;
}

const interval = 1000 / 60; // ~16.67ms for 60Hz //TODO: what if user has a different frame rate
let frameTrackerActive = false;
let timeLeft = interval;

function startFrameTracker() {
   if (frameTrackerActive) return;
   frameTrackerActive = true;
   let lastFrame = performance.now();

   function trackTimeLeft(now: DOMHighResTimeStamp) {
      timeLeft = interval - (now - lastFrame);
      lastFrame = now;
      requestAnimationFrame(trackTimeLeft);
   }

   requestAnimationFrame(trackTimeLeft);
}

