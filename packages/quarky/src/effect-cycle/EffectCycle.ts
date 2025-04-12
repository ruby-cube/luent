import { setImmediate } from "@rue/thread";
import { $schedule, Listener, SchedulerOptions, unwrap } from "@rue/flask";
import { PhaseMap } from "./PhaseMap";
import { EffectLink, EffectVine } from "./EffectLink";
import { noop, pipe } from "@rue/utils";

// returns a enum for the phases
//
// export const [
//    BEFORE_RENDER,
//    RENDER,
//    AFTER_RENDER,
// ] = useReactivity([ //(default to queueTask for all phases)
//    definePhase('BEFORE_RENDER', queueTask),
//    definePhase('RENDER', beforeRepaint),
//    definePhase('AFTER_RENDER', queueTask)
// ])

export const SYNC = 0; // 0 represents both sync and initial task phase
export const PHASE_ONE = 1;
export let DEFAULT_PHASE = PHASE_ONE;

export function setDefaultPhase(phase: number) {
   DEFAULT_PHASE = phase;
}

type EffectCycleHook = (task: () => void, options?: SchedulerOptions) => Listener //Should this be void?

export let onEffectCycleComplete: EffectCycleHook
let schedulePhaseOne = schedulePhase
const initialTaskPhase = { name: 'INITIAL_TASK', phase: SYNC, schedule: noop, scheduleNextPhase: noop, next: undefined }
const cyclePhases: CyclePhase[] = [initialTaskPhase]

type SyncPhase = 0;
type Phases = number[];
type EndPhase = number;

export function useReactivity(phases?: [CyclePhase, ...CyclePhase[]]): [SyncPhase, ...Phases, EndPhase] {
   const completionPhase = definePhase('END_EFFECT_CYCLE')
   if (phases) {
      const phaseNums = [0]
      for (let i = 0; i < phases.length; i++) {
         const phase = phases[i]
         const phaseNum = phase.phase = i + 1;
         phase.next = phases[i + 1]
         cyclePhases.push(phase)
         phaseNums.push(phaseNum)
      }
      if (phases.length === 1) schedulePhaseOne = scheduleFinalPhase
      else cyclePhases.at(-2)!.scheduleNextPhase = scheduleFinalPhase

      const endPhase = cyclePhases.length;
      cyclePhases.at(-1)!.next = completionPhase
      completionPhase.phase = endPhase
      cyclePhases.push(completionPhase)
      phaseNums.push(endPhase)
      onEffectCycleComplete = createEffectCycleHook(endPhase)
      return phaseNums as [SyncPhase, ...Phases, EndPhase];
   }
   cyclePhases.push({
      name: 'BATCHED_EFFECTS',
      phase: PHASE_ONE,
      schedule: setImmediate,
      scheduleNextPhase: noop,
      next: completionPhase
   })
   cyclePhases.push(completionPhase)
   schedulePhaseOne = scheduleFinalPhase
   onEffectCycleComplete = createEffectCycleHook(2)
   return [0, 1, 2]
}


type CyclePhase = {
   name: string,
   phase: number,
   schedule: Function,
   scheduleNextPhase: Function,
   next: CyclePhase | undefined
}


export function definePhase(phaseName: string, scheduler?: Function): CyclePhase {
   return {
      name: phaseName,
      phase: 2,
      schedule: scheduler ?? setImmediate,
      scheduleNextPhase: schedulePhase,
      next: undefined
   }
}


let cycleCount = -1;

let currentCycle: EffectCycle | undefined;
let nextCycle: EffectCycle | undefined;

export function getCurrentEffectCycle(){
   return currentCycle;
}

export function getNextEffectCycle(){
   return nextCycle;
}

export function $effectCycle() {
   let effectCycle = currentCycle
   if (!effectCycle) {
      effectCycle = new EffectCycle().initiate();
   }
   return effectCycle;
}

function beginCycle(effectCycle: EffectCycle) {
   if (currentCycle)
      throw new Error("@% Overlapping update cycles! Need to either implement a different type of update cycle management system or set up guards to prevent overlaps")
   currentCycle = effectCycle;
   schedulePhaseOne(effectCycle, cyclePhases[PHASE_ONE])
}

function closeCycle() {
   currentCycle = nextCycle;
   if (currentCycle) currentCycle.initiate()
}

function schedulePhase(cycle: EffectCycle, { schedule, scheduleNextPhase, phase, next }: CyclePhase) {
   schedule(() => {
      scheduleNextPhase(cycle, next) // schedule next phase BEFORE running phase so that next phase effects will run before effects scheduled DURING phase
      cycle.runEffects(phase)
   })
}

function scheduleFinalPhase(cycle: EffectCycle, { name, schedule, phase, next }: CyclePhase) {
   schedule(() => {
      // scheduleNextPhase
      cycle.runEffects(phase)
      // end cycle
      queueMicrotask(() => {
         cycle.runEffects(next!.phase)
         closeCycle();
      }) // Any set ops after this point will be scheduled for the NEXT render cycle
   })
}



/**
 * 
 */
export class EffectCycle {

   currentPhase: number = SYNC

   initiate() {
      cycleCount++;
      beginCycle(this)
      return this;
   }

   get count() {
      return cycleCount;
   }

   effects: PhaseMap = new PhaseMap('effect cycle');

   scheduleEffects(effects: EffectVine, phase: number) {
      if (phase < this.currentPhase) {
         if (__DEV__) console.warn(`@% CASE RESEARCH: Effect was triggered after phase ${phase} of this cycle. Will schedule for next cycle.`)
         nextCycle = nextCycle ?? new EffectCycle()
         nextCycle.scheduleEffects(effects, phase)
         return;
      }
      this.effects.absorb(effects, phase)
      console.log('scheduled effects', phase, this.effects)
   }

   scheduleEffect(effect: EffectLink, phase: number) {
      if (phase < this.currentPhase) {
         if (__DEV__) console.warn(`@% CASE RESEARCH: Effect was triggered after phase ${phase} of this cycle. Will schedule for next cycle.`)
         nextCycle = nextCycle ?? new EffectCycle()
         nextCycle.scheduleEffect(effect, phase)
         return;
      }
      this.effects.addToVine(effect, phase)
   }

   runEffects(phase: number) {
      this.currentPhase = phase;
      const effects = this.effects.get(phase);
      if (effects) {
         for (const effect of effects) {
            effect.task()
            if (!effect.vine) {
               continue; // effect has already been removed during the effect via 'once' or 'scheduler'
            }
            effect.watchSubject?.completedEffects.addToVine(effect, phase)
         }
      }
   }
}



/**
 * Library API
 * 
 * @param phase 
 * @returns 
 */
export function createEffectCycleHook(phase: number) { //TODO: what happens if phase has already passed? should we queue to next cycle?
   return (task: () => void, options?: SchedulerOptions) => {
      const _options = options || { cancel: null }
      _options.cancel = null
      const effectCycle = $effectCycle()

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


export const queueTask = setImmediate;
