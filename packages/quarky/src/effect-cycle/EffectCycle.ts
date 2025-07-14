import { setImmediate } from "@rue/thread";
import { Effect, EffectQueue, PhaseEffects } from "./EffectQueue";
import { EffectCycleManager, getCurrentPhase } from "./ReactivitySystem";

export const SYNC = 'SYNC' as const
export const UPDATE_CYCLE_END = 'UCE' as const

export type Phase = number | typeof SYNC | typeof UPDATE_CYCLE_END

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



/**
 * 
 */
export class EffectCycle {

   public currentPhase: Phase = SYNC
   constructor(
      public manager: EffectCycleManager
   ) {
   }

   close() {
      this.manager.closeCycle()
   }

   get count() { return this.manager.count }

   private effects: Map<Phase, EffectQueue> = new Map();

   // effectStack: Set<Effect> = new Set()

   private initializeQueue(phase: Phase) {
      const queue: EffectQueue = new EffectQueue(phase)
      this.effects.set(phase, queue);
      return queue
   }

   scheduleEagerEffect(effect: Effect, phase: Phase) {
      const adjustedPhase = this.adjustPhase(phase)
      if (__DEV__ && adjustedPhase !== phase) console.warn('RESEARCH: phase has been adjusted for eager effect')
      const queue = this.effects.get(adjustedPhase) ?? this.initializeQueue(adjustedPhase);
      queue.scheduleEagerEffect(effect)
      if (phase === SYNC) {
         queue.runEffects()
         // queue.runEagerEffects()
      }
   }

   scheduleTask(effect: Effect, phase: Phase) {
      const adjustedPhase = this.adjustPhase(phase)
      if (__DEV__ && adjustedPhase !== phase) console.warn('RESEARCH: phase has been adjusted for task')
      const queue = this.effects.get(adjustedPhase) ?? this.initializeQueue(adjustedPhase);
      queue.scheduleTask(effect)
   }

   scheduleEffects(effects: PhaseEffects, phase: Phase) {
      const adjustedPhase = this.adjustPhase(phase)
      if (__DEV__ && adjustedPhase !== phase) console.warn('RESEARCH: phase has been adjusted', phase, adjustedPhase)
      const queue = this.effects.get(adjustedPhase) ?? this.initializeQueue(adjustedPhase);
      queue.scheduleEffects(effects)
      if (phase === SYNC) {
         queue.runEffects()
      }
   }

   subphase: 'effects' | 'microtasks' = 'effects'

   runEffects(phase: Phase) {
      // this.currentPhase = phase;
      // this.subphase = 'effects'
      const queue = this.effects.get(phase);
      queue?.runEffects()
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
}


export const queueTask = setImmediate;
