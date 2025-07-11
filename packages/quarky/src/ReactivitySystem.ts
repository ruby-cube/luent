import { $listen, $schedule, Listener, ListenerOptions, SchedulerOptions } from "@rue/flask";
import { CyclePhase, EffectCycle, queueTask, SYNC, UPDATE_CYCLE_END } from "./effect-cycle/EffectCycle";
import { noop } from "@rue/utils";
import { Watchable } from "./watch/Watched";
import { Effect, PhaseAtom } from "./effect-cycle/EffectQueue";
import { TaskQueue, TaskRef } from "./effect-cycle/TaskQueue";


type EffectCycleHook = (task: () => void, options?: SchedulerOptions) => Listener //Should this be void?

export class EffectCycleManager {
   constructor(public name: string) { }

   private tasks: Map<string, TaskQueue> = new Map()

   private initializeQueue(phase: string) {
      const queue: TaskQueue = new TaskQueue()
      this.tasks.set(phase, queue);
      return queue
   }

   scheduleTask(task: TaskRef, phase: string) {
      this.current // ensures there will be an effect cycle to run the tasks;
      const queue = this.tasks.get(phase) ?? this.initializeQueue(phase);
      queue.scheduleTask(task)
   }

   runTasks(phase: string) {
      this.tasks.get(phase)?.runTasks()
   }

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
      if (this.currentCycle)
         throw new Error("@% Overlapping update cycles! Need to either implement a different type of update cycle management system or set up guards to prevent overlaps")
      return new EffectCycle(this.phases[0].name, this);
   }

   initCycle() {
      const cycle = this.createCycle()
      schedulePhase(cycle, this.phases[0]
      )
      return cycle;
   }

   closeCycle() {
      this.currentCycle = this.nextCycle
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
      const finalIndex = phases.length - 2;
      if (index < finalIndex) schedulePhase(cycle, next)
      cycleManager.runTasks(phaseHook)
      cycle.runEffects(phaseHook)
      if (index === finalIndex)
         queueMicrotask(() => {
            cycleManager.runTasks(next!.phaseHook)
            cycle.runEffects(next!.phaseHook)
            cycle.close();
         })
   })
}



//TODO:
// [X] sync effects
// [X] preventing infinite loop chains, but allow effects to be triggered further down the pipeline with updated state
//     - prevention should be stopped at '$ion.state = x', do not allow effects that trigger previously triggered state by that effect chain to run
// [ ] Set up base rendering effect cycle
// [ ] doAction integration
// [ ] state locks
// [ ] Set up lazy effect queue (needs to check if action was canceled)
// [ ] Set up animation queue



const cycleManager = new EffectCycleManager('UpdateCycle');

function setUpUpdateCycleManager() {
   cycleManager.pushPhase(new CyclePhase('PRERENDER', queueTask))
   // cycleManager.pushPhase(new CyclePhase('PRE_INTERNAL_RENDER', queueTask))
   cycleManager.pushPhase(new CyclePhase('INTERNAL_RENDER', queueTask))
   cycleManager.pushPhase(new CyclePhase('RENDER', queueMicrotask))
   cycleManager.pushPhase(new CyclePhase('POSTRENDER', queueTask))
   cycleManager.pushPhase(new CyclePhase(UPDATE_CYCLE_END, noop))

   cycleManager.onComplete = createEffectCycleScheduler('UpdateCycle:' + UPDATE_CYCLE_END)
   return cycleManager;
}

export function getUpdateCycleCount() {
   return cycleManager.count
}


type EffectCycleHooks = {
   SYNC: typeof SYNC,
} & {
   [key: string]: string
} & {
   onEffectCycleComplete: EffectCycleHook
}

export function useReactivitySystem(): EffectCycleHooks {
   const cycleManager = setUpUpdateCycleManager()

   const hooks = {
      SYNC,
      onEffectCycleComplete: cycleManager.onComplete
   }

   addHooks(hooks, cycleManager)
   return hooks as EffectCycleHooks;
}

function addHooks(hooks: { [key: string]: string | any }, cycle: EffectCycleManager) {
   const phases = cycleManager.phases
   for (const phase of phases) {
      const phaseName = phase.name
      // hooks[phaseName] = phaseName
      hooks[phaseName] = phase.phaseHook = cycle.name + ':' + phaseName
   }
}



/**
 * Library API
 * 
 * @param phase 
 * @returns 
 */
export function createEffectCycleHook(phase: string) { //TODO: what happens if phase has already passed? should we queue to next cycle?
   return (task: () => void, options?: ListenerOptions) => {
      return $listen(task, options ?? {}, {
         enroll(fn) {
            const task = new TaskRef(fn)
            getEffectCycleManager().scheduleTask(task, phase)
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
export function createEffectCycleScheduler(phase: string) { //TODO: what happens if phase has already passed? should we queue to next cycle?
   return (task: () => void, options?: SchedulerOptions) => {
      return $schedule(task, options ?? {}, {
         enroll(fn) {
            const task = new TaskRef(fn)
            getEffectCycleManager().scheduleTask(task, phase)
            return task;
         },
         remove(task) {
            task.discard()
         }
      })
   }
}


export function getDefaultPhase() {
   const currentPhase = getCurrentPhase()
   if (currentPhase !== SYNC) return currentPhase
   return cycleManager.phases[0].phaseHook //FIX: What should the default phase be?
}



export function getEffectCycleManager() {
   return cycleManager
}


export function $currentEffectCycle() {
   return cycleManager.current
}

export function scheduleEffects(effects: PhaseAtom, phase: string) {
   cycleManager.current.scheduleEffects(effects, phase)
}

export function scheduleEagerEffect(effect: Effect, phase: string) {
   cycleManager.current.scheduleEagerEffect(effect, phase)
}



export function getCurrentPhase() {
   if (cycleManager.current && cycleManager.current.currentPhase !== SYNC) return cycleManager.current.currentPhase;
   return SYNC;
}

