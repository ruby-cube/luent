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
// ] = configureEffectCycle([ //(default to queueTask for all phases)
//    definePhase('BEFORE_RENDER', queueTask),
//    definePhase('RENDER', beforeRepaint),
//    definePhase('AFTER_RENDER', queueTask)
// ])

export const SYNC = 0; // 0 represents both sync and initial task phase
export const PHASE_ONE = 1;

type EffectCycleHook = (task: () => void, options?: SchedulerOptions) => Listener //Should this be void?

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

const phaseNums: number[] = [SYNC] // 0 represents the initial task phase
let cyclePhases: CyclePhase[] = [{ name: 'INITIAL_TASK', phase: SYNC, schedule: noop, scheduleNextPhase: noop, next: undefined }]

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
   schedulePhase(effectCycle, cyclePhases[PHASE_ONE])
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

   currentPhase: number = SYNC

   initiate() {
      cycleCount++;
      beginCycle(this)
      return this;
   }

   get count() {
      return cycleCount;
   }

   effects: PhaseMap = new PhaseMap();

   scheduleEffects(effects: EffectVine, phase: number) {
      if (phase < this.currentPhase) {
         if (__DEV__) console.warn(`CASE RESEARCH: Effect was triggered after phase ${phase} of this cycle. Will schedule for next cycle.`)
         nextCycle = nextCycle ?? new EffectCycle()
         nextCycle.scheduleEffects(effects, phase)
         return;
      }
      const phaseEffects = this.effects.get(phase)
      phaseEffects?.absorb(effects)
   }

   scheduleEffect(effect: EffectLink, phase: number) {
      if (phase < this.currentPhase) {
         if (__DEV__) console.warn(`CASE RESEARCH: Effect was triggered after phase ${phase} of this cycle. Will schedule for next cycle.`)
         nextCycle = nextCycle ?? new EffectCycle()
         nextCycle.scheduleEffect(effect, phase)
         return;
      }
      this.effects.addToVine(effect, phase)
   }

   private runEffects(phase: number) {
      const effects = this.effects.get(phase);
      if (effects) {
         for (const effect of effects) {
            effect.task()
            if (effect.vine !== effects) continue; // effect has already been removed
            const subject = effect.watchSubject;
            if (!subject) continue;
            subject.completedEffects.addToVine(effect, phase)
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
