import { $listen, $schedule, Listener, ListenerOptions, SchedulerOptions } from "@rue/flask";
import { CyclePhase, EffectCycle, Phase, queueTask, SYNC } from "./EffectCycle";
import { Effect } from "./EffectQueue";
import { $forAnimation } from "./animation";



type EffectCycleHook = (task: () => void, options?: SchedulerOptions) => Listener //Should this be void?

export class EffectCycleManager {
   constructor(public name: string, public timeWarning: number = 1000) {

   }

   // private tasks: Map<Phase, TaskQueue> = new Map()

   // private initializeQueue(phase: Phase) {
   //    const queue: TaskQueue = new TaskQueue()
   //    this.tasks.set(phase, queue);
   //    return queue
   // }

   // scheduleTask(task: TaskRef, phase: Phase) {
   //    this.current // ensures there will be an effect cycle to run the tasks;
   //    const queue = this.tasks.get(phase) ?? this.initializeQueue(phase);
   //    queue.scheduleTask(task)
   // }

   // runTasks(phase: Phase) {
   //    this.tasks.get(phase)?.runTasks()
   // }

   count: number = 0;

   private nextCycle: EffectCycle | undefined
   private currentCycle: EffectCycle | undefined

   get next() {
      return this.nextCycle ?? (this.nextCycle = this.createCycle())
   }

   get current() {
      return this.currentCycle ?? (this.currentCycle = this.initCycle())
   }

   createCycle() {
      this.count++;
      return new EffectCycle(this);
   }

   initCycle() {
      const cycle = this.createCycle()
      schedulePhase(cycle, this.phases[0])
      return cycle;
   }

   closeCycle() {
      const cycle = this.currentCycle = this.nextCycle
      if (cycle) {
         // queueTask(()=>{
         this.nextCycle = undefined;
         schedulePhase(cycle, this.phases[0])
         // })
      }
   }

   phases: CyclePhase[] = []

   onComplete!: EffectCycleHook

   pushPhase(phase: CyclePhase) {
      phase.phases = this.phases;
      phase.index = this.phases.length
      this.phases.push(phase);
   }
}

export function isAnimationCycle(cycle: EffectCycle) {
   return cycle.manager.name === 'AnimationCycle'
}

export function isLazyCycle(cycle: EffectCycle) {
    return cycle.manager.name !== 'AnimationCycle'
   return cycle.manager.name === 'LazyEffectCycle'
}


function schedulePhase(cycle: EffectCycle, { index, schedule, phaseHook, next, phases }: CyclePhase) {
   if (cycle.pendingPrerender) {
      cycle.pendingPrerender.then(() => {
         schedule(runEffects)
      })
   }
   else {
      schedule(runEffects)
   }

   function runEffects() {
      // const final = index === phases.length - 1;
      // if (!final) schedulePhase(cycle, next)
      activeManager = cycle.manager; //TODO: Replace with async context $_run_with_context
      cycle.currentPhase = index;
      cycle.subphase = 'effects'
      const running = cycle.runEffects(index)
      cycle.subphase = 'microtasks'

      if (cycle.pendingPrerender) {
         console.log('pending prerender')
         cycle.pendingPrerender.then(closePhase)
      }
      else {
         closePhase()
      }

      function closePhase() {
         const final = index === phases.length - 1;
         if (final) cycle.close()
         else schedulePhase(cycle, next)
         activeManager = null; //NOTE: microtasks and promise tasks cannot be used for animations since activeManager will be null by then.. unless I can pass it via AsyncContext
      }
   }

}



//TODO:
// [X] sync effects
// [X] preventing infinite loop chains, but allow effects to be triggered further down the pipeline with updated state
//     - prevention should be stopped at '$ion.state = x', do not allow effects that trigger previously triggered state by that effect chain to run
// [X] Set up base rendering effect cycle
// [ ] doAction integration
// [ ] state locks
// [ ] Set up lazy effect queue (needs to check if action was canceled)
// [ ] Set up animation queue

function queueResponsive(fn: IdleRequestCallback) {
   return requestIdleCallback(fn, { timeout: 17 })
}

const cycleManager = new EffectCycleManager('UpdateCycle');

function setUpUpdateCycleManager() {
   cycleManager.pushPhase(new CyclePhase('PRERENDER', queueMicrotask))
   cycleManager.pushPhase(new CyclePhase('INTERNAL_RENDER', queueResponsive))
   cycleManager.pushPhase(new CyclePhase('RENDER', queueMicrotask))
   cycleManager.pushPhase(new CyclePhase('INTERNAL_POSTRENDER', queueMicrotask))
   // cycleManager.pushPhase(new CyclePhase(UPDATE_CYCLE_END, noop)) //TODO: Think...

   // cycleManager.onComplete = createEffectCycleScheduler(UPDATE_CYCLE_END)//TODO: Think...
   return cycleManager;
}

const animationCycleManager = new EffectCycleManager('AnimationCycle', 16.7);

export function setUpAnimationCycleManager() {
   animationCycleManager.pushPhase(new CyclePhase('ANIMATION:PRERENDER', queueMicrotask))
   animationCycleManager.pushPhase(new CyclePhase('ANIMATION:INTERNAL_RENDER', queueMicrotask))
   animationCycleManager.pushPhase(new CyclePhase('ANIMATION:RENDER', queueMicrotask))
   animationCycleManager.pushPhase(new CyclePhase('ANIMATION:POSTRENDER', queueMicrotask)) //TODO: Think...
   // cycleManager.pushPhase(new CyclePhase(UPDATE_CYCLE_END, noop)) //TODO: Think...
   return animationCycleManager;
}

// export const lazyActionCycleManager = new EffectCycleManager('LazyActionCycle');

// export function setUpLazyCycleManager() {
//    lazyActionCycleManager.pushPhase(new CyclePhase('LAZY:PRERENDER', queueMicrotask))
//    lazyActionCycleManager.pushPhase(new CyclePhase('LAZY:INTERNAL_RENDER', queueMicrotask))
//    lazyActionCycleManager.pushPhase(new CyclePhase('LAZY:RENDER', queueMicrotask))
//    lazyActionCycleManager.pushPhase(new CyclePhase('LAZY:POSTRENDER', queueMicrotask)) //TODO: Think...
//    // cycleManager.pushPhase(new CyclePhase(UPDATE_CYCLE_END, noop)) //TODO: Think...
//    return lazyActionCycleManager;
// }

// export class LazyAction {
//    cycle: EffectCycle = $currentCycle(lazyActionCycleManager)
// }


const upd1000 = (fn: any) => { fn() }

const lazyEffectCycleManagers: Map<number, EffectCycleManager> = new Map();

let lazyUpdate = false;

export function isLazyUpdate(){
   return lazyUpdate;
}

export function useLazyUpdate(timeWarning: number = Infinity) {
   // const manager = lazyEffectCycleManagers.get(timeWarning) ?? new EffectCycleManager('LazyEffectCycle', timeWarning)
   // lazyEffectCycleManagers.set(timeWarning, manager)

   return function upd<T>(fn: () => T): Promise<T> {
      const cycle = $currentCycle(); //TODO: Replace with actual lazy cycle
      const promise = cycle.pendingPrerender =  new Promise((resolve) => { cycle.resolvePrerender = resolve }) 
      //NOTE: assumes one cycle per lazy call... is this what I want? no... I need a promise.all but for now, let's just use one promise

      try {
         lazyUpdate = true; // assuming function is synchronous. Need AsyncState for asynchronous
         cycle.lazyResult = fn()
         return promise as Promise<T>
      }
      finally {
         lazyUpdate = false;
      }
   }
}

let activeManager: EffectCycleManager | null = null;

export function getUpdateCycleCount() {
   return cycleManager.count
}


type EffectCycleHooks = {
   SYNC: typeof SYNC,
} & {
   [key: string]: Phase
} & {
   // onEffectCycleComplete: EffectCycleHook
}

export function useReactivitySystem(): EffectCycleHooks {
   const cycleManager = setUpUpdateCycleManager()

   const hooks = {
      SYNC,
      // onEffectCycleComplete: cycleManager.onComplete
   }

   addHooks(hooks, cycleManager)
   return hooks as EffectCycleHooks;
}

// export function useAnimationCycle(): EffectCycleHooks {
//    const manager = setUpAnimationCycleManager();
//    const hooks = {
//       SYNC
//    }
//    addHooks(hooks, manager)
//    return hooks as EffectCycleHooks;
// }

function addHooks(hooks: { [key: string]: string | any }, cycle: EffectCycleManager) {
   const phases = cycle.phases
   for (const phase of phases) {
      const phaseName = phase.name
      // hooks[phaseName] = phaseName
      hooks[phaseName] = phase.index
      phase.phaseHook = cycle.name + ':' + phaseName
   }
}



/**
 * Library API
 * 
 * @param phase 
 * @returns 
 */
export function createEffectCycleHook(phase: Phase) {
   return (task: () => void, options?: ListenerOptions) => {
      return $listen(task, options ?? {}, { //TODO: potentially get rid of $listen depending on typical usage
         enroll(fn) {
            const effect = new Effect(fn, phase)
            $currentCycle().scheduleEffect(effect)
            return task;
         },
         remove(task) {
            task.discard()
         }
      })
   }
}

/**
 * Library API
 * 
 * @param phase 
 * @returns 
 */
export function createEffectCycleScheduler(phase: Phase) {
   return (task: () => void, options?: SchedulerOptions) => {
      return $schedule(task, options ?? {}, { //TODO: potentially get rid of $listen depending on typical usage
         enroll(task) {
            const effect = new Effect(task, phase)
            $currentCycle().scheduleEffect(effect)
            return effect;
         },
         remove(effect: Effect) {
            effect.destroy()
         }
      })
   }
}




export function $currentCycle(cycleManager = $currentCycleManager()) {
   // return cycleManager.current;
   const phase = getCurrentPhase(cycleManager)
   if (phase !== SYNC) return cycleManager.next;
   return cycleManager.current;
}


function $currentCycleManager() {
   // return cycleManager;
   if ($forAnimation()) return animationCycleManager;
   return activeManager ?? cycleManager; //TODO: instead of using activeManager, getActiveManager via AsyncContext
}


export function getDefaultPhase() {
   const currentPhase = getCurrentPhase()
   if (currentPhase !== SYNC) return currentPhase
   return 'postrender' // POST_RENDER
}



// export function getEffectCycleManager() {
//    return cycleManager
// }


// export function $currentEffectCycle() {
//    return cycleManager.current
// }

export function getCurrentPhase(cycleManager = $currentCycleManager()) {
   if (cycleManager.current && cycleManager.current.currentPhase !== SYNC) return cycleManager.current.currentPhase;
   return SYNC;
}


// export function getAnimationCycleManager() {
//    return animationCycleManager
// }


// export function $currentAnimationCycle() {
//    return animationCycleManager.current
// }

// export function getCurrentAnimationPhase() {
//    if (animationCycleManager.current && animationCycleManager.current.currentPhase !== SYNC) return animationCycleManager.current.currentPhase;
//    return SYNC;
// }

