import { setImmediate } from "@rue/thread";
import { $schedule, Listener, SchedulerOptions, unwrap } from "@rue/flask";
import { PhaseMap } from "./PhaseMap";
import { EffectLink, EffectVine } from "./EffectLink";



// export let onEffectCycleComplete: EffectCycleHook
// let schedulePhaseOne = schedulePhase
// const initialTaskPhase = { name: 'INITIAL_TASK', phase: SYNC, schedule: noop, scheduleNextPhase: noop, next: undefined }
// const cyclePhases: CyclePhase[] = [{ phase: 'INITIAL_TASK', schedule: noop, scheduleNextPhase: noop, next: undefined }]

// type SyncPhase = 0;
// type Phases = number[];
// type EndPhase = number;

// export function useReactivity(phases?: [CyclePhase, ...CyclePhase[]]): [SyncPhase, ...Phases, EndPhase] {
//    const completionPhase = definePhase('END_EFFECT_CYCLE')
//    if (phases) {
//       const phaseNums = [0]
//       for (let i = 0; i < phases.length; i++) {
//          const phase = phases[i]
//          const phaseNum = phase.phase = i + 1;
//          phase.next = phases[i + 1]
//          cyclePhases.push(phase)
//          phaseNums.push(phaseNum)
//       }
//       if (phases.length === 1) schedulePhaseOne = scheduleFinalPhase
//       else cyclePhases.at(-2)!.scheduleNextPhase = scheduleFinalPhase

//       const endPhase = cyclePhases.length;
//       cyclePhases.at(-1)!.next = completionPhase
//       completionPhase.phase = endPhase
//       cyclePhases.push(completionPhase)
//       phaseNums.push(endPhase)
//       onEffectCycleComplete = createEffectCycleHook(endPhase)
//       return phaseNums as [SyncPhase, ...Phases, EndPhase];
//    }
//    cyclePhases.push({
//       name: 'BATCHED_EFFECTS',
//       phase: PHASE_ONE,
//       schedule: setImmediate,
//       scheduleNextPhase: noop,
//       next: completionPhase
//    })
//    cyclePhases.push(completionPhase)
//    schedulePhaseOne = scheduleFinalPhase
//    onEffectCycleComplete = createEffectCycleHook(2)
//    return [0, 1, 2]
// }


// type CyclePhase = {
//    name: string,
//    phase: number,
//    schedule: Function,
//    scheduleNextPhase: Function,
//    next: CyclePhase | undefined
// }


export function definePhase(phaseName: string, scheduler?: Function): CyclePhase {
   return new CyclePhase(
      phaseName,
      scheduler ?? setImmediate,
   )
}

export class CyclePhase {
   phases!: CyclePhase[]
   index: number = 0

   constructor(
      public phase: string,
      public schedule: Function,
   ) { }

   get next() {
      return this.phases[this.index + 1]
   }

   phaseHook!: string
}


// let cycleCount = -1;

// let currentCycle: EffectCycle | undefined;
// let nextCycle: EffectCycle | undefined;

// export function getCurrentEffectCycle() {
//    return currentCycle;
// }

// export function getNextEffectCycle() {
//    return nextCycle;
// }

// export function $effectCycle() {
//    let effectCycle = currentCycle
//    if (!effectCycle) {
//       effectCycle = new EffectCycle();
//    }
//    return effectCycle;
// }

// function beginCycle(effectCycle: EffectCycle) {
//    if (currentCycle)
//       throw new Error("@% Overlapping update cycles! Need to either implement a different type of update cycle management system or set up guards to prevent overlaps")
//    currentCycle = effectCycle;
//    schedulePhaseOne(effectCycle, cyclePhases[PHASE_ONE])
// }

// function closeCycle() {
//    currentCycle = 
//    nextCycle;
//    if (currentCycle) currentCycle.initiate()
// }

// function schedulePhase(cycle: EffectCycle, { schedule, scheduleNextPhase, phase, next }: CyclePhase) {
//    schedule(() => {
//       scheduleNextPhase(cycle, next) // schedule next phase BEFORE running phase so that next phase effects will run before effects scheduled DURING phase
//       cycle.runEffects(phase)
//    })
// }

// function scheduleFinalPhase(cycle: EffectCycle, { name, schedule, phase, next }: CyclePhase) {
//    schedule(() => {
//       // scheduleNextPhase
//       cycle.runEffects(phase)
//       // end cycle
//       queueMicrotask(() => {
//          cycle.runEffects(next!.phase)
//          cycle.close();
//       }) // Any set ops after this point will be scheduled for the NEXT render cycle
//    })
// }


type EffectCycleHook = (task: () => void, options?: SchedulerOptions) => Listener //Should this be void?

export class EffectCycleManager {
   constructor(public name: string) { }

   count: number = 0;

   current: EffectCycle | undefined

   currentCycle() {
      return this.current ?? new EffectCycle(this)
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

export const SYNC = 'S' as const
export const EVENT_CYCLE_END = 'ECE' as const
export const UPDATE_CYCLE_END = 'UCE' as const


/**
 * 
 */
export class EffectCycle {

   currentPhase: string = SYNC

   constructor(
      public manager: EffectCycleManager
   ) {
      manager.count++;
      if (manager.current)
         throw new Error("@% Overlapping update cycles! Need to either implement a different type of update cycle management system or set up guards to prevent overlaps")
      manager.current = this;
      schedulePhase(this, manager.phases[0])
   }

   close() {
      this.manager.current = undefined;
   }

   get count() {
      return this.manager.count;
   }

   effects: PhaseMap = new PhaseMap('effect cycle');

   scheduleEffects(effects: EffectVine, phase: string) {
      this.effects.absorb(effects, phase)
   }

   scheduleEffect(effect: EffectLink, phase: string) {
      this.effects.addToVine(effect, phase)
   }

   runEffects(phase: string) {
      this.currentPhase = phase;
      const effects = this.effects.get(phase);
      // console.log(phase, 'start size', effects?.size)
      if (effects) {
         for (const effect of effects) {
            // console.log(phase, 'before run effect size', effects?.size)
            effect.task()
            if (!effect.vine) {
               continue; // effect has already been removed during the effect via 'once' or 'scheduler'
            }
            effect.watchSubject?.completedEffects.addToVine(effect, phase)
         }
         // console.log(phase, 'done size', effects?.size)
      }
   }
}








export const queueTask = setImmediate;
