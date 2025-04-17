import { $schedule, Listener, SchedulerOptions } from "@rue/flask";
import { CyclePhase, EffectCycle, EffectCycleManager, EVENT_CYCLE_END, SYNC, UPDATE_CYCLE_END } from "./effect-cycle/EffectCycle";
import { EffectLink, EffectVine } from "./effect-cycle/EffectLink";
import { debug, noop } from "@rue/utils";
import { ParticleMorph } from "./compound/Particle";
import { Watchable } from "./watch/Watched";
import { AnyObject } from "@rue/types";



// const {
//    SYNC,
//    POSTEVENT,
//    RENDER,
//    POSTRENDER,
//    getEndHook
// } = useReactivitySystem({
//    EventCycle: [
//       definePhase('POSTEVENT', queueMicrotask)
//    ],
//    UpdateCycle: [
//       definePhase('RENDER', requestAnimationFrame),
//       definePhase('POSTRENDER', queueMicrotask)
//    ]
// }, {
//    defaultPhase: () => {
//       //TODO: must figure out how to handle default effect stage
//    }
// })


// export const onPostevent = createEffectCycleHook(POSTEVENT)
// export const onRender = createEffectCycleHook(RENDER)
// export const onPostrender = createEffectCycleHook(POSTRENDER)

// export const onEventCycleEnd = getEffectCycleEndHook('EventCycle')
// export const onRenderCycleEnd = getEffectCycleEndHook('UpdateCycle)

type EffectCycleHook = (task: () => void, options?: SchedulerOptions) => Listener //Should this be void?





const reactivitySystem = {
   EventCycle: new EffectCycleManager('EventCycle'),
   UpdateCycle: new EffectCycleManager('UpdateCycle')
}

function setUpEventCycleManager(phases?: [CyclePhase, ...CyclePhase[]]) {
   const cycleManager = reactivitySystem.EventCycle;
   if (phases) {
      //TODO: custom phases
   }
   //FIX: phase names { POSTEVENT: 'EventCycle:POSTEVENT}
   cycleManager.pushPhase(new CyclePhase('POSTEVENT', queueMicrotask))
   cycleManager.pushPhase(new CyclePhase(EVENT_CYCLE_END, noop))
   cycleManager.onComplete = createEffectCycleHook('EventCycle:'+EVENT_CYCLE_END)
   return cycleManager
}

function setUpUpdateCycleManager(phases?: [CyclePhase, ...CyclePhase[]]) {
   const cycleManager = reactivitySystem.UpdateCycle;
   if (phases) {
      //TODO: custom phases
   }
   cycleManager.pushPhase(new CyclePhase('RENDER', requestAnimationFrame))
   cycleManager.pushPhase(new CyclePhase('POSTRENDER', queueMicrotask))
   cycleManager.pushPhase(new CyclePhase(UPDATE_CYCLE_END, noop))
   cycleManager.onComplete = createEffectCycleHook('UpdateCycle:'+UPDATE_CYCLE_END)
   return cycleManager;
}




type EffectCycleHooks = {
   SYNC: typeof SYNC,
} & { [key: string]: string } & { getEndHook: (cycle: 'EventCycle' | 'UpdateCycle') => EffectCycleHook }

export function useReactivitySystem(phases?: [CyclePhase, ...CyclePhase[]]): EffectCycleHooks {
   const hooks = {
      SYNC,
      getEndHook(cycle: 'EventCycle' | 'UpdateCycle') {
         return reactivitySystem[cycle].onComplete;
      }
   }

   const EventCycle = setUpEventCycleManager(phases);
   const UpdateCycle = setUpUpdateCycleManager(phases)

   addHooks(hooks, EventCycle)
   addHooks(hooks, UpdateCycle)
   return hooks as EffectCycleHooks;
}

function addHooks(hooks: { [key: string]: string | any }, cycle: EffectCycleManager) {
   const phases = cycle.phases
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
      const cycle = getEffectCycle(phase);
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




// type ReactivitySystem = {
//    createPhaseHook: (phase: string) => PhaseHook;
//    createCycleCompleteHook: (cycle: string) => CycleCompleteHook
//    cycles: {
//       [key: string]: EffectCycleManager
//    },
//    phases: {
//       [key: string]: Phase
//    }
// }

// type EffectCycleManager = {
//    count: number
//    current: EffectCycle | undefined
//    // next: EffectCycle | undefined
//    currentCycle(): EffectCycle
//    // nextCycle(): EffectCycle
// }


// type Phase = {
//    cycle: EffectCycleManager,
//    index: number,
// }

// function getPhase(phase: string) {
//    return reactivitySystem.phases[phase];
// }

export function getDefaultPhase() {
   const currentPhase = getCurrentPhase()
   if (currentPhase !== SYNC) return currentPhase
   return reactivitySystem.EventCycle.phases[0].phaseHook
}



export function getEffectCycle(phase: string) {
   if (phase.startsWith('EventCycle:')) return reactivitySystem.EventCycle
   else return reactivitySystem.UpdateCycle
}


export function scheduleEffects(effects: EffectVine, phase: string) {
   getEffectCycle(phase).currentCycle().scheduleEffects(effects, phase)
}

export function scheduleEffect(effect: EffectLink, phase: string) {
   getEffectCycle(phase).currentCycle().scheduleEffect(effect, phase)
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
   const updateCycle = reactivitySystem.UpdateCycle
   if (updateCycle.current && updateCycle.current.currentPhase !== SYNC) {
      debug.error(`Cannot mutate reactive data during update cycle. Current Phase: ${getCurrentPhase()}. Use queueTask or something similar to defer mutation to a separate task/event`)
   }

   this.asParticle?.triggerCompounds()
   this.asWatched?.triggerEffects()
}

export function getCurrentPhase() {
   const updateCycle = reactivitySystem.UpdateCycle
   if (updateCycle.current && updateCycle.current.currentPhase !== SYNC) return updateCycle.current.currentPhase;
   const eventCycle = reactivitySystem.EventCycle;
   if (eventCycle.current && eventCycle.current.currentPhase !== SYNC) return eventCycle.current.currentPhase;
   return SYNC;
}