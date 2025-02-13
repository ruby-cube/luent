import { setImmediate } from "@rue/thread";
import { $schedule, Listener, SchedulerOptions, unwrap } from "@rue/flask";
import { PhaseMap } from "./PhaseMap";
import { EffectLink } from "./EffectLink";
import { noop, pipe } from "@rue/utils";

// returns a enum for the phases
//
// export const [
//    BEFORE_RENDER,
//    RENDER,
//    AFTER_RENDER,
// ] = configureEffectCycle([ //(default to queueTask for all phases)
//    definePhase('BEFORE_RENDER', queueTask),
//    definePhase('RENDER', beforeRepaint),
//    definePhase('AFTER_RENDER', queueTask)
// ])

type EffectCycleHook = (effect: () => void, options?: SchedulerOptions) => Listener //Should this be void?

export let onEffectCycleComplete: EffectCycleHook

export function setUpEffectCycle(phases: [CyclePhase, ...CyclePhase[]]) {
   pipe(
      () => cyclePhases.at(-1)!.scheduleNextPhase = scheduleFinalPhase,
      () => definePhase('END_EFFECT_CYCLE'),
      () => onEffectCycleComplete = createEffectCycleHook(phaseNums.at(-1)!)
   )
   return phaseNums;
}



type CyclePhase = {
   name: string,
   phase: number,
   schedule: Function,
   scheduleNextPhase: Function,
   next: CyclePhase | undefined
}

const phaseNums: number[] = [0] // 0 represents the initial task phase
let cyclePhases: CyclePhase[] = [{ name: 'INITIAL_TASK', phase: 0, schedule: noop, scheduleNextPhase: noop, next: undefined }]

export function definePhase(phaseName: string, scheduler?: Function): CyclePhase {
   const prevPhase = cyclePhases.at(-1)
   const cyclePhase = {
      name: phaseName,
      phase: phaseNums.length,
      schedule: scheduler ?? setImmediate,
      scheduleNextPhase: schedulePhase,
      next: undefined
   }
   cyclePhases.push(cyclePhase)
   phaseNums.push(phaseNums.length)
   if (prevPhase) prevPhase.next = cyclePhase;
   return cyclePhase
}


let cycleCount = -1;

let currentCycle: EffectCycle | undefined;
let nextCycle: EffectCycle | undefined;

export function $effectCycle() {
   let effectCycle = currentCycle
   if (!effectCycle) {
      effectCycle = new EffectCycle().initiate();
   }
   return effectCycle;
}

function beginCycle(effectCycle: EffectCycle) {
   if (currentCycle)
      throw new Error("Overlapping update cycles! Need to either implement a different type of update cycle management system or set up guards to prevent overlaps")
   currentCycle = effectCycle;
   schedulePhase(effectCycle, cyclePhases[1])
}

function closeCycle() {
   currentCycle = nextCycle;
   if (currentCycle) currentCycle.initiate()
}

function schedulePhase(cycle: EffectCycle, { schedule, scheduleNextPhase, phase, next }: CyclePhase) {
   schedule(() => {
      scheduleNextPhase(cycle, next) // schedule next phase BEFORE running phase so that next phase effects will run before effects scheduled DURING phase
      cycle.runPhase(phase)
   })
}

function scheduleFinalPhase(cycle: EffectCycle, { schedule, phase, next }: CyclePhase) {
   schedule(() => {
      cycle.runPhase(phase)
      cycle.runPhase(next!.phase)
      closeCycle(); // Any set ops after this point will be scheduled for the NEXT render cycle
   })
}



/**
 * 
 */
export class EffectCycle {

   currentPhase: number = 0

   initiate() {
      cycleCount++;
      beginCycle(this)
      return this;
   }

   get count() {
      return cycleCount;
   }

   effects: PhaseMap = new PhaseMap();

   scheduleEffect(effect: EffectLink, phase: number) {
      if (phase < this.currentPhase) {
         if (__DEV__) console.warn(`CASE RESEARCH: Effect was triggered after phase ${phase} of this cycle. Will schedule for next cycle.`)
         nextCycle = nextCycle ?? new EffectCycle()
         nextCycle.scheduleEffect(effect, phase)
         return;
      }

      this.effects.addToSet(effect, phase)

      return {
         cancel: () => {
            this.effects.deleteFromSet(effect, phase)
         }
      }
   }

   private runEffects(phase: number) {
      const effects = this.effects.get(phase);
      if (effects) {
         for (const effect of effects) {
            effect.task()
         }
      }
   }

   runPhase(phase: number) {
      this.currentPhase = phase;
      this.runEffects(phase);
   }
}



/**
 * Library API
 * 
 * @param phase 
 * @returns 
 */
export function createEffectCycleHook(phase: number) {
   return (effect: () => void, options?: SchedulerOptions) => {
      const _options = options || { cancel: null }
      _options.cancel = null
      const effectCycle = $effectCycle()
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


export const queueTask = setImmediate;
