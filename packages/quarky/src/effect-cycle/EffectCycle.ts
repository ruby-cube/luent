import { setImmediate } from "@rue/thread";
import { Effect, EffectQueue, PhaseQueue } from "./EffectQueue";
import { EffectCycleManager } from "./ReactivitySystem";
import { POSTRENDER } from "@rue/lumo";

export const SYNC = 'SYNC' as const

export type Phase = number | typeof SYNC | typeof POSTRENDER

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

let initialLoad = true;

/**
 * 
 */
export class EffectCycle {

   currentPhase: Phase = SYNC

   startTime = performance.now()

   constructor(
      public manager: EffectCycleManager
   ) {
   }

   idleIDs: number[] = []

   cancelled: boolean = false;

   cancel() {
      this.idleIDs.forEach((id) => cancelIdleCallback(id))
      this.cancelled = true;
   }

   close() {
      const delta = performance.now() - this.startTime
      const manager = this.manager;
      const timeLimit = manager.initialLoad ? 1000 : manager.timeWarning
      if (delta > timeLimit) console.warn('Interaction-to-paint time exceeds', timeLimit, 'ms:', delta)
      manager.closeCycle()
      manager.initialLoad = undefined;
   }

   get count() { return this.manager.count }

   private effects: Map<Phase, EffectQueue> = new Map(); // pass in an object to constructor instead of map

   // effectStack: Set<Effect> = new Set()

   private initializeQueue(phase: Phase) {
      const queue: EffectQueue = new EffectQueue(phase)
      this.effects.set(phase, queue);
      return queue
   }

   // scheduleEagerEffect(effect: Effect) {
   //    const phase = effect.phase
   //    const adjustedPhase = this.adjustPhase(phase)
   //    if (__DEV__ && adjustedPhase !== phase) console.warn('RESEARCH: phase has been adjusted for eager effect')
   //       const queue = this.effects.get(adjustedPhase) ?? this.initializeQueue(adjustedPhase);
   //    queue.scheduleEagerEffect(effect)
   //    if (phase === SYNC) {
   //       queue.runEffects()
   //       // queue.runEagerEffects()
   //    }
   // }

   // scheduleTask(effect: Effect) {
   //    const phase = effect.phase
   //    const adjustedPhase = this.adjustPhase(phase)
   //    if (__DEV__ && adjustedPhase !== phase) console.warn('RESEARCH: phase has been adjusted for task')
   //       const queue = this.effects.get(adjustedPhase) ?? this.initializeQueue(adjustedPhase);
   //    queue.scheduleTask(effect)
   // }

   scheduleEffects(effects: PhaseQueue, phase: Phase) {
      const adjustedPhase = this.adjustPhase(phase)
      // if (__DEV__ && adjustedPhase !== phase) console.warn('RESEARCH: phase has been adjusted', phase, adjustedPhase)
      const queue = this.effects.get(adjustedPhase) ?? this.initializeQueue(adjustedPhase);
      queue.scheduleEffects(effects)
   }

   scheduleEffect(effect: Effect) {
      // if ($currentCycle().manager.name === 'UpdateCycle') console.trace('wrong cycle?')
      const phase = effect.phase
      const adjustedPhase = this.adjustPhase(phase)
      // if (__DEV__ && adjustedPhase !== phase) console.warn('RESEARCH: phase has been adjusted', phase, adjustedPhase)
      const queue = this.effects.get(adjustedPhase) ?? this.initializeQueue(adjustedPhase);
      queue.scheduleEffect(effect)
   }

   subphase: 'effects' | 'microtasks' = 'effects'

   runEffects(phase: Phase) {
      // this.currentPhase = phase;
      // this.subphase = 'effects'
      const queue = this.effects.get(phase);
      return queue?.runEffects(this)
      // this.subphase = 'microtasks'
   }

   adjustPhase(phase: Phase) {
      // if (phase === SYNC) return SYNC;
      return this.currentPhase === phase ? phase
         : phase === SYNC ? this.currentPhase
            : this.currentPhase === SYNC ? phase : phase > this.currentPhase ? phase : this.currentPhase
      //TODO: what about if current phase is post render and scheduled phase is pre, internal render, or render? 
      // should it get scheduled for the next cycle? I think this is the answer--it should start a new cycle
   }

   pendingPrerender?: Promise<void>;
   resolvePrerender?: (result: any) => void
   prerenderCount: number = 0;
   lazyResult: unknown
}


export const queueTask = setImmediate;
