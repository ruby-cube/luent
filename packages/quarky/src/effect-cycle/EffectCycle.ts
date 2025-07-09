import { setImmediate } from "@rue/thread";
import { Listener, SchedulerOptions } from "@rue/flask";
import { Effect, EffectQueue, WatchedAtom } from "./EffectQueue";
import { TaskRef } from "./TaskQueue";
import { EffectCycleManager } from "../ReactivitySystem";



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
      public name: string,
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



export const SYNC = 'S' as const
export const UPDATE_CYCLE_END = 'UCE' as const


/**
 * 
 */
export class EffectCycle {

   constructor(
      public currentPhase: string,
      public manager: EffectCycleManager
   ) {
      console.log('NEW EFFECT CYCLE')
   }

   close() {
      this.manager.closeCycle()
   }

   // get count() {
   //    return this.manager.count;
   // }

   effects: PhaseMap = new PhaseMap('effect cycle');

   effectChains: Map<WatchedAtom, Set<Effect>> = new Map()

   scheduleEffects(atom: WatchedAtom, phase: string) {
      this.effects.scheduleEffects(atom, phase)
   }

   scheduleEagerEffect(effect: Effect, phase: string) {
      this.effects.scheduleEagerEffect(effect, phase)
   }

   subphase: 'effects' | 'microtasks' = 'effects'

   runEffects(phase: string) {
      this.currentPhase = phase;
      this.subphase = 'effects'
      const effects = this.effects.get(phase);
      effects?.runEffects()
      this.subphase = 'microtasks'
   }
}




class PhaseMap extends Map<string, EffectQueue | null> {
   constructor(
      public __DEV__name: string
   ) {
      super();
   }

   private initializeQueue(phase: string) {
      const queue: EffectQueue = new EffectQueue()
      this.set(phase, queue);
      return queue
   }

   scheduleEagerEffect(effect: Effect, phase: string){
      const queue = this.get(phase) ?? this.initializeQueue(phase);
      queue.scheduleEagerEffect(effect)
   }

   scheduleEffects(atom: WatchedAtom, phase: string) {
      const queue = this.get(phase) ?? this.initializeQueue(phase);
      queue.scheduleEffects(atom)

   }

   scheduleTask(task: TaskRef, phase: string){
        const queue = this.get(phase) ?? this.initializeQueue(phase);
        queue.scheduleTask(task)
   }
}



export const queueTask = setImmediate;
