import { $schedule, Listener, SchedulerOptions } from "@rue/flask";
import { CyclePhase, EffectCycle, queueTask, SYNC, UPDATE_CYCLE_END } from "./effect-cycle/EffectCycle";
import { noop } from "@rue/utils";
import { ParticleMorph } from "./compound/Particle";
import { Watchable } from "./watch/Watched";
import { Effect, WatchedAtom } from "./effect-cycle/EffectQueue";
import { TaskRef } from "./effect-cycle/TaskQueue";


type EffectCycleHook = (task: () => void, options?: SchedulerOptions) => Listener //Should this be void?

export class EffectCycleManager {
   constructor(public name: string) { }

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
      cycle.runEffects(phaseHook)
      if (index === finalIndex)
         queueMicrotask(() => {
            cycle.runEffects(next!.phaseHook)
            cycle.close();
         })
   })
}



//TODO:
// [ ] sync effects
// [ ] preventing infinite loop chains, but allow effects to be triggered further down the pipeline with updated state
//     - prevention should be stopped at '$ion.state = x', do not allow effects that trigger previously triggered state by that effect chain to run
// [ ] Set up base rendering effect cycle
// [ ] doAction integration
// [ ] state locks
// [ ] Set up lazy effect queue (needs to check if action was canceled)
// [ ] Set up animation queue



const cycleManager = new EffectCycleManager('UpdateCycle');

function setUpUpdateCycleManager() {
   cycleManager.pushPhase(new CyclePhase('PRERENDER', queueTask))
   cycleManager.pushPhase(new CyclePhase('RENDER', queueTask))
   cycleManager.pushPhase(new CyclePhase('POSTRENDER', queueTask))
   cycleManager.pushPhase(new CyclePhase(UPDATE_CYCLE_END, noop))

   cycleManager.onComplete = createEffectCycleHook('UpdateCycle:' + UPDATE_CYCLE_END)
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
   return (task: () => void, options?: SchedulerOptions) => {
      const _options = options || { cancel: null }
      _options.cancel = null
      const cycle = getEffectCycleManager();
      const effectCycle = cycle.current

      return $schedule(task, _options, {
         enroll(fn) {
            const task = new TaskRef(fn)
            effectCycle.effects.scheduleTask(task, phase)
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


export function $currentEffectCycle(){
   return cycleManager.current
}

export function scheduleEffects(effects: WatchedAtom, phase: string) {
   cycleManager.current.scheduleEffects(effects, phase)
}

export function scheduleEagerEffect(effect: Effect, phase: string) {
   cycleManager.current.scheduleEagerEffect(effect, phase)
}

/**
 * @param quark 
 * @param op 
 * @param args 
 * @param output 
 * @param preopData 
 */
export function trigger( //TODO: figure out which abstraction this belongs to ...  atomic ions, atomic pions, memoized derivations, but not terminal compound
   this: ParticleMorph & Watchable,
) {
   // const updateCycle = reactivitySystem.UpdateCycle
   // if (updateCycle.current && updateCycle.current.currentPhase !== SYNC) {
   //    debug.warn(`It is not recommended to mutate reactive state during batched effects. It can lead to state that doesn't match expectations. Current Phase: ${getCurrentPhase()}. Run effect synchronously to change using { phase: 'AT_CHANGE'} option or use queueTask or something similar to defer mutation to a separate task`)
   // }

   // this.asParticle?.triggerCompounds()
   this.asWatched?.triggerEffects()
}

export function getCurrentPhase() {
   if (cycleManager.current && cycleManager.current.currentPhase !== SYNC) return cycleManager.current.currentPhase;
   return SYNC;
}


