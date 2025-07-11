import { setImmediate } from "@rue/thread";
import { Effect, EffectQueue, PhaseAtom } from "./EffectQueue";
import { EffectCycleManager } from "./ReactivitySystem";

export const SYNC = 'SYNC' as const
export const UPDATE_CYCLE_END = 'UCE' as const

type Phase = string

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

   constructor(
      public currentPhase: Phase,
      public manager: EffectCycleManager
   ) {
      console.log('%%% (new effect cycle created)')
   }

   close() {
      this.manager.closeCycle()
   }

   get count(){ return this.manager.count}

   private effects: Map<Phase, EffectQueue> = new Map();

   effectStack: Set<Effect> = new Set()

   private initializeQueue(phase: Phase) {
      const queue: EffectQueue = new EffectQueue()
      this.effects.set(phase, queue);
      return queue
   }

   scheduleEagerEffect(effect: Effect, phase: Phase) {
      const queue = this.effects.get(phase) ?? this.initializeQueue(phase);
      queue.scheduleEagerEffect(effect)
      if (phase === SYNC){
         queue.runEagerEffects()
      }
   }

   scheduleEffects(atom: PhaseAtom, phase: Phase) {
      const queue = this.effects.get(phase) ?? this.initializeQueue(phase);
      atom.scheduleEffects(queue)
   }

   subphase: 'effects' | 'microtasks' = 'effects'

   runEffects(phase: string) {
      this.currentPhase = phase;
      this.subphase = 'effects'
      const effects = this.effects.get(phase);
      effects?.runTriggeredEffects()
      console.log(`%%% ${phase} microtasks...?`)
      this.subphase = 'microtasks'
   }
}

export const queueTask = setImmediate;
