

import { noop } from "@rue/utils"
import { ICyclePhase, Phase, phases, popUpdate, pushUpdate, SYNC, Update } from "./UpdateCycle"
import { EffectQueue, PhaseTask, TaskQueue } from "./EffectQueue"
import { PRERENDER } from "./render-cycle"


// event task
// - mutation ()




/**
 * @internal
 */
export class EffectCycle {

   currentPhase: Phase = SYNC

   phases: ICyclePhase[]

   startTime = performance.now()

   constructor(
      public update: Update,
   ) {
      this.phases = phases // from module
   }



   start() {
      this.schedulePhase(phases[0]) // from module
   }

   schedulePhase({ index: phase, next }: ICyclePhase) {
      queueMicrotask(() => {
         this.currentPhase = phase
         this.subphase = 'effects'
         this.runEffects(phase, (beginTasks) => {
            this.subphase = 'tasks'
            beginTasks()
            queueMicrotask(() => {
               // if (phase === PRERENDER) this.update.emitPrerenderPhaseComplete()
               this.closePhase(next)
            })
         })
      })
   }

   runSyncEffects() {
      this.subphase = 'effects'
      this.runEffects(SYNC, (beginTasks) => {
         this.subphase = 'tasks'
         beginTasks()
      })
   }


   // schedulePhase_({ index, schedule, next }: ICyclePhase) {
   //    schedule(() => {
   //       this.currentPhase = index;
   //       this.subphase = 'effects'
   //       this.runEffects(index)
   //          .then(() => {
   //             resolve()
   //             this.subphase = 'tasks'
   //          })
   //       popUpdate() // from module

   //       if (this.pendingPreupdate) {
   //          this.pendingPreupdate.then(() => this.closePhase(next)) // delays scheduling next phase until prerender is complete
   //          this.pendingPreupdate = undefined
   //       }
   //       else {
   //          this.closePhase(next)
   //       }
   //    })
   // }

   closePhase(nextPhase: ICyclePhase | undefined) {
      if (!nextPhase || this.cancelled) {
         this.close()
      }
      else this.schedulePhase(nextPhase)
   }

   idleIDs: number[] = []

   cancelled: boolean = false;

   cancel() {
      this.idleIDs.forEach((id) => cancelIdleCallback(id))
      this.cancelled = true;
   }

   // private closingTasks: (() => void)[] = []

   // onClose(task: () => void) {
   //    this.closingTasks.push(task)
   // }

   close() {
      const delta = performance.now() - this.startTime
      const timeMargin = this.update.timeMargin
      if (timeMargin && delta > timeMargin) console.warn('Interaction-to-update time exceeds', timeMargin, 'ms:', delta)
      // this.closingTasks.forEach(task => task())
   }

   private effects: Map<Phase, TaskQueue> = new Map(); // pass in an object to constructor instead of map

   // effectStack: Set<Effect> = new Set()

   private initializeQueue(phase: Phase) {
      const queue: TaskQueue = new TaskQueue(this, phase)
      this.effects.set(phase, queue);
      return queue
   }

   scheduleEffects(effects: EffectQueue, phase: Phase) {
      const adjustedPhase = this.adjustPhase(phase)
      // if (__DEV__ && adjustedPhase !== phase) console.warn('RESEARCH: phase has been adjusted', phase, adjustedPhase)
      const queue = this.effects.get(adjustedPhase) ?? this.initializeQueue(adjustedPhase);
      queue.scheduleEffects(effects)
   }

   scheduleTask(task: PhaseTask) {
      // if ($currentCycle().manager.name === 'UpdateCycle') console.trace('wrong cycle?')
      const phase = task.phase
      const adjustedPhase = this.adjustPhase(phase)
      // if (__DEV__ && adjustedPhase !== phase) console.warn('RESEARCH: phase has been adjusted', phase, adjustedPhase)
      const queue = this.effects.get(adjustedPhase) ?? this.initializeQueue(adjustedPhase);
      queue.scheduleTask(task)
   }

   subphase: 'effects' | 'tasks' = 'effects'

   runningEffects: boolean = false;

   runEffects(phase: Phase, onComplete: (beginTasks: Function) => void) {
      const queue = this.effects.get(phase);
      if (!queue) return { then: noop }

      return queue.runEffects(this, onComplete)
   }

   adjustPhase(phase: Phase) {
      // if (phase === SYNC) return SYNC;
      return this.currentPhase === phase ? phase
         : phase === SYNC ? this.currentPhase
            : this.currentPhase === SYNC ? phase : phase > this.currentPhase ? phase : this.currentPhase
   }
}