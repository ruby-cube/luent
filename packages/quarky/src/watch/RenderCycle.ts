import { setImmediate, clearImmediate } from "@rue/thread";
import { $schedule, SchedulerOptions, unwrap } from "@rue/flask";
import { SetMap } from "@rue/utils";
import { Ionized } from "../ionized/ionize";
import { MetaIonizedModel } from "../ionized/MetaIonizedModel";
import { MutationRecord } from "./watch";
import { AnyObject } from "@rue/types";
import { quarksOf } from "../Quarks";

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

let renderCycleCount = -1;

let currentRenderCycle: TaskCycle | undefined;
// let flushingRenderCycle: TaskCycle | undefined;

// function startFlushPhase(phase: Phase, renderCycle: TaskCycle) {
//     renderCycle.setPhase(phase);
//     // flushingRenderCycle = renderCycle
// }

// function endFlushPhase(renderCycle: TaskCycle) {
//     renderCycle.endPhase()
//     // flushingRenderCycle = undefined
// }

export function getCurrentRenderCycle() {
   return currentRenderCycle;
}

export function useRenderCycle() {
   let renderCycle = currentRenderCycle
   if (!renderCycle) {
      renderCycle = new TaskCycle();

   }
   return renderCycle;
}

// export function getFlushingRenderCycle() {
//     return flushingRenderCycle;
// }



function startCollectingEffects(renderCycle: TaskCycle) {
   if (currentRenderCycle)
      throw new Error("Overlapping update cycles! Need to either implement a different type of update cycle management system or set up guards to prevent overlaps")
   return currentRenderCycle = renderCycle;
}

function endCollectingEffects() {
   currentRenderCycle = undefined;
}

export class TaskCycle {

   completedPhase: Phase | 0 = 0
   setCompletedPhase(phase: Phase) {
      this.completedPhase = phase
   }

   phase: Phase = Phase.SYNC
   setPhase(phase: Phase) {
      this.phase = phase
   }

   constructor() {
      renderCycleCount++;
      startCollectingEffects(this)
      queueTask(() => { //QUESTION: Should I wrap in a flask??
         beforeRepaint(() => {
            queueTask(() => { // queue this BEFORE running render so that it will run as soon after render as possible
               this.setPhase(Phase.AFTER_RENDER)
               this.runTasks(Phase.AFTER_RENDER);
               this.setCompletedPhase(Phase.AFTER_RENDER)

               this.runTasks(Phase.CYCLE_COMPLETE)
               this.setCompletedPhase(Phase.CYCLE_COMPLETE)
               endCollectingEffects(); // Any set ops after this point will be scheduled for the NEXT render cycle
            })
            this.setPhase(Phase.RENDER)
            this.runTasks(Phase.RENDER);
            this.setCompletedPhase(Phase.RENDER)
         })
         this.setPhase(Phase.BEFORE_RENDER)
         this.runTasks(Phase.BEFORE_RENDER);
         this.setCompletedPhase(Phase.BEFORE_RENDER)
      })
   }

   get count() {
      return renderCycleCount;
   }

   opsMap: WeakMap<MetaIonizedModel, MutationRecord[]> = new WeakMap();

   recordOp(target: Ionized<AnyObject>, op: MutationRecord) {
      const meta = quarksOf(target)
      let existingOps = this.opsMap.get(meta);
      if (existingOps) {
         existingOps.push(op)
      }
      else {
         this.opsMap.set(meta, [op]);
      }
   }

   getOps(target: Ionized<AnyObject>) {
      const quarks = quarksOf(target)
      return this.opsMap.get(quarks)
   }


   // TASKS:

   tasks: SetMap<Phase, Task> = new SetMap();

   scheduleTask(task: Task, phase: Exclude<Phase, Phase.SYNC>) {
      if (phase <= this.completedPhase) {
         if (__DEV__) console.warn(`CASE RESEARCH: Effect was triggered after render cycle phase ${phase}. Task will not run. Potentially implement a way to schedule for next cycle instead if needed?`)
         return;
      }
      // if (target === unwrap(effect)) {
      //     this.reactiveEffects.addToSet(effect, phase)
      // }
      // else {
      this.tasks.addToSet(task, phase)
      // }
      return {
         cancel: () => {
            this.tasks.deleteFromSet(task, phase)
         }
      }
   }

   runTasks(phase: Phase) {
      const tasks = this.tasks.get(phase);
      if (tasks) {
         for (const task of tasks) {
            // runEffect(effect)
            task()
         }
      }
      // const reactiveEffects = this.reactiveEffects.get(phase)
      // if (reactiveEffects) {
      //     for (const effect of reactiveEffects) {
      //         // runEffect(effect);
      //         effect()
      //     }
      // }
   }

   // TASKS

   // tasks: {
   //     [Hooks.BEFORE_RENDER]: Set<Function>,
   //     [Hooks.ON_RENDERED]: Set<Function>,
   //     [Hooks.ON_RENDER_CYCLE_COMPLETE]: Set<Function>,
   // } = {
   //         [Hooks.BEFORE_RENDER]: new Set(),
   //         [Hooks.ON_RENDERED]: new Set(),
   //         [Hooks.ON_RENDER_CYCLE_COMPLETE]: new Set(),
   //     }


   // runTasks(hookName: Hooks) {
   //     const tasks = currentRenderCycle?.tasks;
   //     if (!tasks) return;
   //     const _tasks = tasks[hookName]
   //     for (const task of _tasks) {
   //         task();
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


function createRenderCycleHook(phase: Phase) {
   return (task: () => void, options?: SchedulerOptions) => {
      const _options = options || { cancel: null }
      _options.cancel = null
      const renderCycle = useRenderCycle()
      return $schedule(task, _options, {
         enroll(task) {
            renderCycle.tasks.addToSet(task, phase)
         },
         remove(task) {
            renderCycle.tasks.deleteFromSet(task, phase)
         }
      })
   }
}

export const beforeRender = createRenderCycleHook(Phase.BEFORE_RENDER)
export const onRender = createRenderCycleHook(Phase.RENDER)
export const afterRender = createRenderCycleHook(Phase.AFTER_RENDER)
export const onRenderCycleComplete = createRenderCycleHook(Phase.CYCLE_COMPLETE)


// export function onPhaseCompleted(phase: Phase, handler: () => void) {
//     if (phase === Phase.BEFORE_RENDER) {
//         afterPrerenderPhase(handler)
//     }
//     else if (phase === Phase.RENDER) {
//         afterRender(handler)
//     }
//     else if (phase === Phase.AFTER_RENDER) {
//         onRenderCycleComplete(handler)

//     }
//     else if (phase === Phase.SYNC) {
//         throw new Error("This should never happen. There is no after sync phase hook")
//     }
// }


// export function runPrerenderEffectsAndTasks() {
//     const renderCycle = getCurrentRenderCycle()
//     if (renderCycle) {
//         renderCycle.runTasks(Phase.BEFORE_RENDER);
//         renderCycle.runTasks(Hooks.AFTER_PRERENDER_PHASE)
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