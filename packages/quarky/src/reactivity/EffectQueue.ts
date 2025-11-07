import { __DEV__unwrap } from "@rue/utils";
import { TrackedAtom } from "./Atom";
import { Phase, SYNC, catchCancelledUpdate, popUpdate, pushUpdate } from "./UpdateCycle";
import { EffectCycle } from "./EffectCycle";
import { INTERNAL_POSTRENDER, INTERNAL_RENDER, PRERENDER, RENDER } from "./render-cycle";

// const PRERENDER = 0 //QUESTION: Should UpdateCycle and EffectQueue belong to Lumo also??

type TaskFn = (...args: any[]) => unknown

export class PhaseTask {
   // running = false
   // active: boolean = false;
   // completed: boolean = false;
   // requeued: boolean = false;
   // queued: boolean = false;

   constructor(
      public run: TaskFn | null,
      public phase: Phase
   ) { }
}

export class Effect implements PhaseTask {
   // running = false
   // active: boolean = false;


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
      // this.requeued = false; //QUESTION: not sure if this is necessary
      this.atoms.delete(atom)
   }

   //FIX: unlinking needs to remove effect from the atom's phase queue
   unlinkAtoms() {
      // this.requeued = false;
      // this.queued = false;
      this.atoms.clear()
   }

   // completed: boolean = false;
   // requeued: boolean = false;
   // queued: boolean = false;
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

const effectsComplete: { [key: number | string]: undefined | Promise<void> } = {
   [SYNC]: undefined,
   [PRERENDER]: undefined,
   [INTERNAL_RENDER]: undefined,
   [RENDER]: undefined,
   [INTERNAL_POSTRENDER]: undefined,
}


export const phase = {
   get prerender() {
      return effectsComplete[<number>PRERENDER] ?? Promise.resolve()
   },
   get render() {
      return effectsComplete[<number>RENDER] ?? Promise.resolve()
   }
}

export function queuePrerenderTask(task: () => void) {
   phase.prerender.then(task)
}

export function queueRenderTask(task: () => void) {
   phase.render.then(task)
}

/**
 * Belongs to the current effect cycle.
 */
export class TaskQueue {
   protected moreEffects: EffectQueue[] | undefined;
   protected effects: EffectQueue[] = []

   effectsComplete: Promise<void>;
   protected emitEffectsComplete!: (value: void | PromiseLike<void>) => void;

   constructor(
      public cycle: EffectCycle,
      protected phase: Phase
   ) {
      effectsComplete[phase] = this.effectsComplete = new Promise<void>((resolve) => { this.emitEffectsComplete = resolve })
   }

   scheduleTask(task: PhaseTask) {
      this.effectsComplete.then(task.run) // TODO: how do I run tasks as idle?
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
export class PrerenderTaskQueue extends TaskQueue {
   // private moreEffects: EffectQueue[] | undefined;
   // private effects: EffectQueue[] = []

   // effectsComplete: Promise<void>;
   // private emitEffectsComplete!: (value: void | PromiseLike<void>) => void;

   constructor(
      cycle: EffectCycle,
   ) {
      super(cycle, PRERENDER)
      // effectsComplete[phase] = this.effectsComplete = new Promise<void>((resolve) => { this.emitEffectsComplete = resolve })
   }

   // scheduleTask(task: PhaseTask) {
   //    this.effectsComplete.then(task.run) // TODO: how do I run tasks as idle?
   // }

   // scheduleEffects(effects: EffectQueue) {

   //    if (this.runningEffects && !effects.requeued) {
   //       // a currentEffect during runningEffects means the effect triggered 
   //       // other effects and should be added to the effectStack to prevent infinite loops
   //       // const currentEffect = $currentEffect()
   //       // if (currentEffect) $currentEffectCycle().effectStack.add(currentEffect)
   //       effects.requeued = true;
   //       const extension = this.moreEffects ?? (this.moreEffects = [])
   //       extension.push(effects)
   //    }
   //    else if (!effects.queued) {
   //       this.effects.push(effects)
   //       effects.queued = true;
   //    }
   // }

   // runningEffects: boolean = false

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

   // runEffect(effect: Effect) {
   //    const update = this.cycle.update
   //    try {
   //       this.runningEffects = true
   //       pushUpdate(update)
   //       effect.run?.()
   //    }
   //    catch (err) {
   //       catchCancelledUpdate(err)
   //    }
   //    finally {
   //       popUpdate()
   //       this.runningEffects = false
   //    }
   // }
}
