import { $schedule, Listener, SchedulerOptions } from "@rue/flask";
import { CyclePhase, EffectCycleManager, queueTask, SYNC, UPDATE_CYCLE_END } from "./effect-cycle/EffectCycle";
import { EffectLink, EffectVine } from "./effect-cycle/EffectLink";
import { noop } from "@rue/utils";
import { ParticleMorph } from "./compound/Particle";
import { Watchable } from "./watch/Watched";




type EffectCycleHook = (task: () => void, options?: SchedulerOptions) => Listener //Should this be void?

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
      const phaseName = phase.phase
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
      const cycle = getEffectCycle();
      const effectCycle = cycle.currentCycle()

      return $schedule(task, _options, {
         enroll(task) {
            const effectLink = new EffectLink(task)
            effectCycle.effects.addToVine(effectLink, phase)
            return effectLink;
         },
         remove(effectLink) {
            effectLink.remove()
         }
      })
   }
}


export function getDefaultPhase() {
   const currentPhase = getCurrentPhase()
   if (currentPhase !== SYNC) return currentPhase
   return cycleManager.phases[0].phaseHook //FIX: What should the default phase be?
}



export function getEffectCycle() {
   return cycleManager
}


export function scheduleEffects(effects: EffectVine, phase: string) {
   cycleManager.currentCycle().scheduleEffects(effects, phase)
}

export function scheduleEffect(effect: EffectLink, phase: string) {
   cycleManager.currentCycle().scheduleEffect(effect, phase)
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

   this.asParticle?.triggerCompounds()
   this.asWatched?.triggerEffects()
}

export function getCurrentPhase() {
   if (cycleManager.current && cycleManager.current.currentPhase !== SYNC) return cycleManager.current.currentPhase;
   return SYNC;
}