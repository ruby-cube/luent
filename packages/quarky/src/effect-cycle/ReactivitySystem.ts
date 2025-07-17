import { $listen, $schedule, Listener, ListenerOptions, SchedulerOptions } from "@rue/flask";
import { CyclePhase, EffectCycle, Phase, queueTask, SYNC, UPDATE_CYCLE_END } from "./EffectCycle";
import { noop } from "@rue/utils";
import { Effect } from "./EffectQueue";



type EffectCycleHook = (task: () => void, options?: SchedulerOptions) => Listener //Should this be void?

export class EffectCycleManager {
   constructor(public name: string) { }

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
         this.nextCycle = undefined;
         schedulePhase(cycle, this.phases[0])
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




function schedulePhase(cycle: EffectCycle, { index, schedule, phaseHook, next, phases }: CyclePhase) {
   schedule(() => {
      // activeManager = cycle.manager
      const final = index === phases.length - 1;
      if (!final)
         schedulePhase(cycle, next)
      cycle.currentPhase = index;
      cycle.subphase = 'effects'
      cycle.runEffects(index)
      cycle.subphase = 'microtasks'
      // if (index === finalIndex)
      //    queueMicrotask(() => {
      //       activeManager = cycle.manager
      //       // cycleManager.runTasks(next!.index)
      //       cycle.runEffects(next!.index)
      //       cycle.close();
      //       activeManager = null;
      //    })
      // if (index === phases.length-2/*after render*/) 
         // activeManager = null; //FIX: This does not wait for microtasks :( ... any microtasks will be considered outside of cycle :( 
      if (final) cycle.close() // TODO: close before post render??
   })
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



const cycleManager = new EffectCycleManager('UpdateCycle');

function setUpUpdateCycleManager() {
   cycleManager.pushPhase(new CyclePhase('PRERENDER', queueMicrotask))
   cycleManager.pushPhase(new CyclePhase('INTERNAL_RENDER', queueMicrotask))
   cycleManager.pushPhase(new CyclePhase('RENDER', queueMicrotask))
   // cycleManager.pushPhase(new CyclePhase('POSTRENDER', queueTask)) //TODO: Think...
   // cycleManager.pushPhase(new CyclePhase(UPDATE_CYCLE_END, noop)) //TODO: Think...

   // cycleManager.onComplete = createEffectCycleScheduler(UPDATE_CYCLE_END)//TODO: Think...
   return cycleManager;
}

// const animationCycleManager = new EffectCycleManager('AnimationCycle');

// function setUpAnimationCycleManager() {
//    animationCycleManager.pushPhase(new CyclePhase('ANIMATION:PRERENDER', queueMicrotask))
//    animationCycleManager.pushPhase(new CyclePhase('ANIMATION:INTERNAL_RENDER', queueMicrotask))
//    animationCycleManager.pushPhase(new CyclePhase('ANIMATION:RENDER', queueMicrotask))
//    // animationCycleManager.pushPhase(new CyclePhase('ANIMATION:POSTRENDER', queueTask)) //TODO: Think...
//    // cycleManager.pushPhase(new CyclePhase(UPDATE_CYCLE_END, noop)) //TODO: Think...
//    return animationCycleManager;
// }

// let activeManager: EffectCycleManager | null = null

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




export function $currentCycle() {
   return cycleManager.current;
   // const phase = getCurrentPhase()
   // if (phase !== SYNC && !activeManager) return cycleManager.next;
   // return $currentCycleManager().current;
}


function $currentCycleManager() {
   return cycleManager;
   // if (forAnimation()) return animationCycleManager;
   // return activeManager ?? cycleManager;
}


export function getDefaultPhase() {
   const currentPhase = getCurrentPhase()
   if (currentPhase !== SYNC) return currentPhase
   return 0 //FIX: What should the default phase be?
}



// export function getEffectCycleManager() {
//    return cycleManager
// }


// export function $currentEffectCycle() {
//    return cycleManager.current
// }

export function getCurrentPhase() {
   const cycleManager = $currentCycleManager()
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

