import { Effects } from "./Atom";
import { Effect } from "./Effect";
import { $activeUpdate, getActiveUpdate, popUpdate, pushUpdate, Update } from "./Update";

export const queueTask = (task: () => void) =>
   //@ts-expect-error
   scheduler
      .postTask(task);


type Task = () => void

// [X] run sync effects
// [X] skip effects that have already been run *** (completed.has(effect) for each round)
// [X] make sure Effects of TrackedAtoms don't get queued multiple times
// [X] run tick effects
// [X] phase management
// [X] initialize lazily
// --
// [] manage precommit vs postcommit + generator
// [] phases as promises
// [] infinite loop detection/prevention

export enum Phase {
   SYNC = 's',
   PRELUDE = 'p',
   RENDER = 'r',
   LAYOUT = 'l',
   TICK = 't'
}

export const { LAYOUT, PRELUDE, RENDER, SYNC, TICK } = Phase

export const phaseKeys = [SYNC, PRELUDE, RENDER, LAYOUT, TICK]


export function createPhaseMap(): { [K in typeof phaseKeys[number]]: undefined } {
   const map = Object.create(null)
   for (const phase of phaseKeys) {
      map[phase] = undefined
   }
   return map
}


export class RenderCycle {

   currentPhase = SYNC

   phases: { [K in typeof phaseKeys[number]]?: InstanceType<typeof phaseClasses[K]> } = createPhaseMap()

   getPhase(phase: Phase) {
      return (this.phases[phase] ?? (this.phases[phase] = this.createPhase(phase)))
   }

   createPhase(phase: Phase): BasePhase & CycledPhase {
      return new phaseClasses[phase](phase) as BasePhase & CycledPhase
   }

   constructor(private update: Update) {

   }

   get more() {
      return this.phases[PRELUDE]?.more || this.phases[RENDER]?.more || this.phases[LAYOUT]?.more
   }

   started = false

   loop = 0;

   start() {
      this.started = true;
      while (this.more) {
         this.loop++;
         console.log('@@@ this.loop', this.loop)

         console.log('@@@ prelude---')
         this.currentPhase = PRELUDE
         const prelude = this.phases[PRELUDE]
         if (prelude) this.runPhase(prelude)

         if (this.loop === 1) {
            this.update.commit()
         }

         console.log('@@@ render---')
         this.currentPhase = RENDER
         const render = this.phases[RENDER]
         if (render) this.runPhase(render)

         console.log('@@@ layout---')
         this.currentPhase = LAYOUT
         const layout = this.phases[LAYOUT]
         if (layout) this.runPhase(layout)
      }
      if (!this.update.committed) this.update.commit()

      console.log('@@@ tick---')
      this.currentPhase = TICK
      this.runEffects(TICK)

      this.update.complete()
      if (__DEV__) {
         requestAnimationFrame((time) =>
            this.timecheck(time)
         )
      }
   }

   startTime = performance.now()

   timecheck(now: DOMHighResTimeStamp) {
      const delta = now - this.startTime
      const timeMargin = this.update.timeMargin
      if (timeMargin && delta > timeMargin) {
         if (timeMargin !== 16.7) console.log('Interaction-to-paint time exceeds', timeMargin, 'ms:', delta)
      }
      else {
         if (timeMargin === Infinity) console.log('passed timecheck', timeMargin, delta)
      }
   }

   runPhase(phase: CycledPhase) {
      let effects = phase.effects
      phase.effects = []

      let tasks: Task[] = phase.tasks
      phase.tasks = []

      pushUpdate(this.update)
      let loop = 0
      while (effects.length || tasks.length) {
         loop++
         const ran: Set<Effect> = new Set()
         for (const queue of effects) {
            queue.runEffects(ran, this.update)
         }
         for (const task of tasks) {
            task()
         }
         effects = phase.effects
         tasks = phase.tasks
         phase.effects = []
         phase.tasks = []
      }

      popUpdate()
   }

   scheduleEffects(effects: Effects, phase: Phase) {
      this.getPhase(phase).scheduleEffects(effects)
   }

   scheduleTask(task: Task, phase: Phase.LAYOUT | Phase.PRELUDE | Phase.RENDER) {
      (this.getPhase(phase) as CycledPhase).scheduleTask(task)
   }

   runEffects(phaseKey: Phase.SYNC | Phase.TICK) {
      const phase = this.phases[phaseKey]
      if (!phase) return;
      let effects = phase.effects
      phase.effects = []

      while (effects.length) {
         const ran: Set<Effect> = new Set()
         for (const queue of effects) {
            queue.runEffects(ran, this.update)
         }
         effects = phase.effects
         phase.effects = []
      }
   }

   // runTickEffects() {
   //    const phase = this.phases[TICK]
   //    if (!phase) return;
   //    let effects = phase.effects
   //    phase.effects = []

   //    while (effects.length) {
   //       const ran: Set<Effect> = new Set()
   //       for (const queue of effects) {
   //          queue.runEffects(ran, this.update)
   //       }
   //       effects = phase.effects
   //       phase.effects = []
   //    }
   // }
}


class BasePhase {
   effects: Effects[] = []

   get more() {
      return this.effects.length
   }

   constructor(
      public phase: Phase
   ) { }

   scheduleEffects(effects: Effects) {
      console.log('@@@ schedule effects', this.effects, 'queued?', this.queued(effects))
      if (!this.queued(effects)) {
         this.effects.push(effects)
      }
   }

   queued(effects: Effects) {
      return this.effects.indexOf(effects) > -1
   }
}

class CycledPhase extends BasePhase {
   tasks: Task[] = []

   get more() {
      console.log('this.effects.length', this.effects.length)
      return this.effects.length || this.tasks.length
   }

   constructor(
      public phase: Phase
   ) {
      super(phase)
   }

   scheduleTask(task: Task) {
      this.tasks.push(task)
   }
}

const phaseClasses = {
   [SYNC]: BasePhase,

   [PRELUDE]: CycledPhase,
   [RENDER]: CycledPhase,
   [LAYOUT]: CycledPhase,

   [TICK]: BasePhase,
}





/**
 * TEMPORARY
 * @returns 
 */
export function $currentCycle() {
   const update = getActiveUpdate()
   if (!update) throw new Error('Must wrap in update')
   return update.cycle
}

export function getDefaultPhase(): Phase {
   return TICK;
}


export function getCurrentPhase() {
   const update = getActiveUpdate()
   if (!update) return SYNC;
   return update.cycle.currentPhase;
}


let _prelude: Promise<void> | undefined = undefined
let _render: Promise<void> | undefined = undefined
let _layout: Promise<void> | undefined = undefined
let _tick: Promise<void> | undefined = undefined





export function prelude() {
   const update = $activeUpdate()
   if (!update) return _prelude ?? (_prelude = new Promise<void>(resolve => {
      queueMicrotask(() => {
         _prelude = undefined
         resolve()
      })
   }))
   return update.cycle.$effectsComplete(PRELUDE)
}


export function renderphase() {
   const update = $activeUpdate()
   if (!update) return _render ?? (_render = new Promise<void>(resolve => {
      prelude().then(() => {
         queueMicrotask(() => {
            _render = undefined
            resolve()
         })
      })
   }))
   return update.cycle.$effectsComplete(RENDER)
}


// TODO: LAYOUT

export function tick() {
   // const update = $activeUpdate()
   // if (!update) return _tick ?? (_tick = 
   return new Promise<void>(resolve => {
      queueTask(() => {
         _tick = undefined
         resolve()
      })
   })
   // }))
   // return update.cycle.$effectsComplete(TICK)
}


export function queuePrelude(task: Task) {
   $activeUpdate()?.cycle.scheduleTask(task, PRELUDE)
}

export function queueRender(task: Task) {
   $activeUpdate()?.cycle.scheduleTask(task, RENDER)
}

export function queueLayout(task: Task) {
   $activeUpdate()?.cycle.scheduleTask(task, LAYOUT)
}
