import { setImmediate, clearImmediate } from "@rue/thread";
import { $schedule, SchedulerOptions, unwrap } from "@rue/flask";
import { SetMap } from "@rue/utils";
import { PhaseMap } from "./PhaseMap";
import { EffectLink } from "./EffectLink";

// returns a enum for the phases
// export const {
//    SYNC,
//    BEFORE_RENDER,
//    RENDER,
//    AFTER_RENDER
// } = configureEffectCycle([ //(default to queueTask for all phases)
//    definePhase('BEFORE_RENDER', queueTask),
//    definePhase('RENDER', beforeRepaint),
//    definePhase('AFTER_RENDER', scheduler: queueTask)
// ])

export type Watchable = any
// AtomicIon | DerivedIon | IonicEffect  | IonizedModel | ObservedProp
export type Task = (...args: any[]) => void;

// export type Phase = Phase.BEFORE_RENDER | Phase.RENDER | Phase.AFTER_RENDER | Phase.SYNC

export enum Phase {
   SYNC = 1,
   BEFORE_RENDER,
   RENDER,
   AFTER_RENDER,
   CYCLE_COMPLETE,
}

export const SYNC = Phase.SYNC
export const BEFORE_RENDER = Phase.BEFORE_RENDER
export const ON_RENDER = Phase.RENDER
export const AFTER_RENDER = Phase.AFTER_RENDER

// const COMPLETE: 4 = Phase.AFTER_RENDER + 1 as 4

let cycleCount = -1;

let currentCycle: EffectCycle | undefined;
// let flushingRenderCycle: EffectCycle | undefined;

// function startFlushPhase(phase: Phase, effectCycle: EffectCycle) {
//     effectCycle.setPhase(phase);
//     // flushingRenderCycle = effectCycle
// }

// function endFlushPhase(effectCycle: EffectCycle) {
//     effectCycle.endPhase()
//     // flushingRenderCycle = undefined
// }

export function getCurrentEffectCylce() {
   return currentCycle;
}

export function useEffectCycle() {
   let effectCycle = currentCycle
   if (!effectCycle) {
      effectCycle = new EffectCycle();

   }
   return effectCycle;
}

// export function getFlushingRenderCycle() {
//     return flushingRenderCycle;
// }



function startCollectingEffects(effectCycle: EffectCycle) {
   if (currentCycle)
      throw new Error("Overlapping update cycles! Need to either implement a different type of update cycle management system or set up guards to prevent overlaps")
   return currentCycle = effectCycle;
}

function endCollectingEffects() {
   currentCycle = undefined;
}

export class EffectCycle {

   completedPhase: Phase | 0 = 0
   setCompletedPhase(phase: Phase) {
      this.completedPhase = phase
   }

   phase: Phase = Phase.SYNC
   setPhase(phase: Phase) {
      this.phase = phase
   }

   constructor() {
      cycleCount++;
      startCollectingEffects(this)
      queueTask(() => { //QUESTION: Should I wrap in a flask??
         beforeRepaint(() => {
            queueTask(() => { // queue this BEFORE running render so that it will run as soon after render as possible
               this.setPhase(Phase.AFTER_RENDER)
               this.runEffects(Phase.AFTER_RENDER);
               this.setCompletedPhase(Phase.AFTER_RENDER)

               this.runEffects(Phase.CYCLE_COMPLETE)
               this.setCompletedPhase(Phase.CYCLE_COMPLETE)
               endCollectingEffects(); // Any set ops after this point will be scheduled for the NEXT render cycle
            })
            this.setPhase(Phase.RENDER)
            this.runEffects(Phase.RENDER);
            this.setCompletedPhase(Phase.RENDER)
         })
         this.setPhase(Phase.BEFORE_RENDER)
         this.runEffects(Phase.BEFORE_RENDER);
         this.setCompletedPhase(Phase.BEFORE_RENDER)
      })
   }

   get count() {
      return cycleCount;
   }



   // TASKS:
   effects: PhaseMap = new PhaseMap();
   // effects: SetMap<Phase, Task> = new SetMap();

   scheduleEffect(effect: EffectLink, phase: Exclude<Phase, Phase.SYNC>) {
      if (phase <= this.completedPhase) {
         if (__DEV__) console.warn(`CASE RESEARCH: Effect was triggered after render cycle phase ${phase}. Task will not run. Potentially implement a way to schedule for next cycle instead if needed?`)
         return;
      }
      // if (target === unwrap(effect)) {
      //     this.reactiveEffects.addToSet(effect, phase)
      // }
      // else {
      this.effects.addToSet(effect, phase)
      // }
      return {
         cancel: () => {
            this.effects.deleteFromSet(effect, phase)
         }
      }
   }

   private runEffects(phase: Phase) {
      const effects = this.effects.get(phase);
      if (effects) {
         for (const effect of effects) {
            effect.task()
         }
      }
   }

   // TASKS

   // effects: {
   //     [Hooks.BEFORE_RENDER]: Set<Function>,
   //     [Hooks.ON_RENDERED]: Set<Function>,
   //     [Hooks.ON_RENDER_CYCLE_COMPLETE]: Set<Function>,
   // } = {
   //         [Hooks.BEFORE_RENDER]: new Set(),
   //         [Hooks.ON_RENDERED]: new Set(),
   //         [Hooks.ON_RENDER_CYCLE_COMPLETE]: new Set(),
   //     }


   // runEffects(hookName: Hooks) {
   //     const effects = currentCycle?.effects;
   //     if (!effects) return;
   //     const _tasks = effects[hookName]
   //     for (const effect of _tasks) {
   //         effect();
   //     }
   // }
}

// function getCurrentValue(target: ReactiveTarget) {
//     if (isFunction(target)) {
//         return target()
//     }
//     else if (isIonizedModel(target)) {
//         return target;
//     }
// }



// export enum Hooks {
//     BEFORE_RENDER = "br",
//     ON_RENDERED = "or",
//     ON_RENDER_CYCLE_COMPLETE = "uc"
// }


// const updateCompletedTasks: (() => void)[] = [];


function createCycleHook(phase: Phase) {
   return (effect: () => void, options?: SchedulerOptions) => {
      const _options = options || { cancel: null }
      _options.cancel = null
      const effectCycle = useEffectCycle()
      let effectLink: EffectLink
      return $schedule(effect, _options, {
         enroll(effect) {
            effectLink = new EffectLink(effect)
            effectCycle.effects.addToSet(effectLink, phase)
         },
         remove() {
            effectCycle.effects.deleteFromSet(effectLink, phase)
         }
      })
   }
}

export const beforeRender = createCycleHook(Phase.BEFORE_RENDER)
export const onRender = createCycleHook(Phase.RENDER)
export const afterRender = createCycleHook(Phase.AFTER_RENDER)
export const onEffectCycleComplete = createCycleHook(Phase.CYCLE_COMPLETE)


// export function onPhaseCompleted(phase: Phase, handler: () => void) {
//     if (phase === Phase.BEFORE_RENDER) {
//         afterPrerenderPhase(handler)
//     }
//     else if (phase === Phase.RENDER) {
//         afterRender(handler)
//     }
//     else if (phase === Phase.AFTER_RENDER) {
//         onEffectCycleComplete(handler)

//     }
//     else if (phase === Phase.SYNC) {
//         throw new Error("This should never happen. There is no after sync phase hook")
//     }
// }


// export function runPrerenderEffectsAndTasks() {
//     const effectCycle = getCurrentEffectCylce()
//     if (effectCycle) {
//         effectCycle.runEffects(Phase.BEFORE_RENDER);
//         effectCycle.runEffects(Hooks.AFTER_PRERENDER_PHASE)
//     }
// }

function beforeRepaint(cb: () => void) {
   const id = requestAnimationFrame(cb)
   return {
      cancel: () => cancelAnimationFrame(id)
   }
}

function queueTask(cb: () => void) {
   const id = setImmediate(cb)
   return {
      cancel() {
         clearImmediate(id)
      }
   }
}