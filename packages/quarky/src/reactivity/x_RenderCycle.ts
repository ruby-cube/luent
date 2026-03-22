

import { $activeUpdate, getActiveUpdate, popUpdate, pushUpdate, tickUpdate, UpdateType } from "./Update"
import { Effect, EffectQueue, TaskQueue } from "./Effect"
import { Flask } from "@rue/flask"
import { getInternalTrace } from "../../../flask/debug"
import { Update } from "./Update";
import { noop } from "@rue/utils";


// function queueSwiftTask(task: Task) {
//    // console.trace('queueSwiftTask')
//    return requestIdleCallback(task, { timeout: 17 })
// }

export type Phase = typeof SYNC | AsyncPhase

type AsyncPhase =
   typeof PRELUDE
   | typeof INTERNAL_RENDER
   | typeof RENDER
   | typeof POSTLUDE
   | typeof TICK

//    enum Phase {
//       PRELUDE = 0,
//       INTERNAL_RENDER,
//       LAYOUT,
//       RENDER,
//       PRELUDE_II,
//       INTERNAL_RENDER_II,
//       POSTLUDE,
//       TICK,
//       SYNC = 'SYNC'
// }

export const SYNC = 'SYNC'
export const PRELUDE = 0
export const INTERNAL_RENDER = 1

// TODO: ??
export const RENDER = 2
export const POSTLUDE = 3
export const TICK = 4


// type CyclePhase = {
//    phase: AsyncPhase;
//    scheduleEffects: (task: Task) => void;
//    // scheduleTasks: (task: Task) => void;
// }


// function assertSequentialPhases(phases: CyclePhase[]) {
//    let i = phases.length
//    while (i--) {
//       if (phases[i].phase !== i) {
//          throw new Error('[RUE INTERNAL ERROR] phase numbers incorrect')
//       }
//    }
// }

function runTask(fn: Function) {
   fn()
}

const queueIdleTask = (task: IdleRequestCallback) => requestIdleCallback(task, { timeout: 1 })

/**
 * @internal
 */
export class RenderCycle {

   currentPhase: Phase = SYNC

   phases: Phase[] = [
      PRELUDE,
      INTERNAL_RENDER,
      RENDER,
      POSTLUDE,
      TICK
   ]

   startTime = performance.now()

   process: CycleProcess

   constructor(
      public update: Update,
   ) {
      // console.log('(()) render cycle', update.idle)
      this.process = new CycleProcess(update)
      // const schedulePrerenderTasks = update.idle ? queueIdleTask : runTask // TODO: need to check deadline for queueSwiftTask
      // const scheduleInternalRender = update.idle ? queueTask : runTask

      // this.phases = [{
      //    phase: PRELUDE,
      //    // scheduleEffects: queueTask,
      //    scheduleEffects: update.idle ? queueIdleTask : runTask, // TODO: can I get rid of this microtask?
      //    // scheduleTasks: schedulePrerenderTasks,
      // }, {
      //    phase: INTERNAL_RENDER,
      //    scheduleEffects: (runEffects) => { this.update.commit(); runEffects() },
      //    // scheduleTasks: runTask
      // }, {
      //    phase: RENDER,
      //    scheduleEffects: runTask,
      //    // scheduleTasks: runTask,
      // }, {
      //    phase: POSTLUDE,
      //    scheduleEffects: runTask,
      //    // scheduleTasks: runTask,
      // }, {
      //    phase: TICK,
      //    scheduleEffects: queueTask,
      //    // scheduleTasks: queueTask,
      // }]

      this.effects[INTERNAL_RENDER] = new TaskQueue(update, INTERNAL_RENDER)

      // if ( __DEV__) assertSequentialPhases(this.phases)
   }

   started = false

   start() {
      if (this.cancelled === true) return;
      this.runPrecommit(() => {
         this.update.commit()
         this.runPostcommit()
         // this.scheduleTick()
         this.update.complete()
         if (__DEV__) {
            requestAnimationFrame((time) =>
               this.timecheck(time)
            )
         }
      })
      // ---- DO NOT WRITE CYCLE BEHAVIOR AFTER THIS LINE: GENERATOR MAY BE PAUSED ----
   }

   runPrecommit(onComplete: () => void) {
      const genState: { paused: boolean, gen: Generator } = { paused: false, gen: undefined! }
      if (this.update.idle) {
         this.process.start(() => this.runPhase(PRELUDE, genState, onComplete), genState)
      }
      else {
         this.process.runSync(() => this.runPhase(PRELUDE, undefined, onComplete))
      }
   }

   *runPhase(phase: Phase, genState?: { paused: boolean, gen: Generator }, onComplete: () => void = noop) {
      // if (this.update.timeMargin === 1000 && this.update.idle === false) 
      console.log('runPhase', phase)
      this.currentPhase = phase
      this.subphase = 'effects'
      const { process } = this

      const queue = this.effects[phase]
      if (!queue) {
         console.log('no queue', phase)
         onComplete()
         return;
      }

      const { update } = queue
      const runProcess =
         phase === PRELUDE && update.idle ? (fn: () => Generator) => process.runNext(fn) :
            (fn: () => Generator) => process.runSync(fn)

      queue.started = true;
      pushUpdate(update)

      queue.runningEffects = true
      let i = 1
      while (i--) {
         const queues = queue.effects;
         const completed = phase === SYNC ? undefined : new Set<Effect>()
         console.log('batches', phase, queues)
         for (const batch of queues) {
            console.log('run batch', phase)
            batch.requeued = false
            runProcess(() => batch.runEffects(queue.runEffect, completed, genState ? process : undefined, () => {
               if (genState) {
                  process.resumeOuter(genState, () => {
                     if (update.completed) return;
                     pushUpdate(this.update)
                  })
               }
            }))

            if (genState && process.mustPause()) {
               popUpdate()
               process.prepOuterPause(genState, () => {
                  if (update.completed) return;
                  pushUpdate(update)
               })
               yield;
            }
            batch.queued = queue.moreEffects?.length ? batch.requeued : false;
            // batch.requeued = false;
         }

         queue.effects = queue.moreEffects ?? []
         queue.moreEffects = undefined;

         this.subphase = 'tasks'
         const tasks = queue.tasks;

         for (let i = 0; i < tasks.length; i++) {
            tasks[i]()

            if (genState && process.mustPause() && i + 1 !== tasks.length) {
               popUpdate()
               process.prepOuterPause(genState, () => {
                  if (update.completed) return;
                  pushUpdate(update)
               })
               yield;
            }
         }

         queue.tasks = []

         if (queue.effects.length) {
            // console.warn('RUN AGAIN', phase)
            i = 1
         }
      }
      queue.runningEffects = false

      // if (this.cancelled) return; // TODO: Manage cancellation with trycatch?
      popUpdate()

      onComplete()
   }

   runPostcommit() {
      const { phases } = this
      for (let i = 1; i < phases.length; i++) {
         const phase = phases[i]
         this.process.runSync(() => this.runPhase(phase))
         if (this.cancelled) return;
      }
   }

   // scheduleTick() {
   //    const queue = this.effects[TICK]
   //    if (!queue) return;
   //    requestAnimationFrame(() => {
   //       queueTask(() => {
   //          queue.update.start()
   //          this.process.runSync(() => this.runPhase(TICK)) //TODO: There should be new updates for each tick task.. right?
   //       })
   //    })
   // }


   // private startTasks: (() => void)[] | undefined

   // private runStartTasks() {
   //    const startTasks = this.startTasks
   //    if (startTasks)
   //       for (const task of startTasks) {
   //          task()
   //       }
   // }

   // onStart(fn: () => void) {
   //    if (this.started) {
   //       fn()
   //    }
   //    else {
   //       const startTasks = this.startTasks ?? (this.startTasks = [])
   //       startTasks.push(fn)
   //    }
   // }

   // schedulePhase({ phase, scheduleEffects }: CyclePhase) {
   //    scheduleEffects(() => {
   //       if (this.cancelled) return;
   //       this.currentPhase = phase
   //       this.subphase = 'effects'

   //       // pushUpdate(this.update)
   //       this.runEffects(phase, (runTasks) => {
   //          if (this.cancelled) return;
   //          this.subphase = 'tasks'
   //          runTasks(() =>
   //             this.closePhase(phase)
   //          )
   //       })
   //       // popUpdate()
   //    })
   // }

   runSyncEffects() {
      this.process.runSync(() => this.runPhase(SYNC))
      this.effects[SYNC] = undefined
   }

   idleIDs: number[] = []

   cancelled: boolean = false;

   cancel() {
      // try {
      this.idleIDs.forEach((id) => cancelIdleCallback(id))
      let i = this.phases.length
      while (i--) {
         this.effects[i]?.cancel()
      }
      this.cancelled = true;
      // }
      // catch (error) {
      //    console.log('CATCH', error)
      // }
   }

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

   effects: { [key: number | string]: TaskQueue | undefined } = {
      [SYNC]: undefined,
      [PRELUDE]: undefined, // can be idle
      // --- commit ... synchronous from this point on
      [INTERNAL_RENDER]: undefined,
      [RENDER]: undefined,


      [POSTLUDE]: undefined,
      // --- queueTask, instant update
      [TICK]: undefined
   }

   useTaskQueue(phase: Phase) {
      return this.effects[phase]
         ?? (this.effects[phase] =
            phase === TICK
               ? this.createTickTaskQueue()
               : new TaskQueue(this.update, phase)
         )
   }

   private createTickTaskQueue() {
      const { update } = this

      const tick = new TaskQueue(update, TICK) // TODO: should this be new update??
      tick.runEffect = (effect) => {
         requestAnimationFrame(() => {
            queueTask(() => {
               console.log('#### TICK')
               if (!effect.run) return;
               const _update = new Update(
                  update.type,
                  update.timeMargin,
                  update.type === UpdateType.USER_INTERACTION ? false : update.idle // TODO: not sure about this
               )
               _update.queue(effect.run).start()
            })
         })
      }
      return tick
   }

   onCompleted(task: () => void) { // TODO: tick tasks
      // this.$effectsComplete(TICK).then(fn)
   }

   scheduleEffects(effects: EffectQueue, phase: Phase) {
      const adjustedPhase = this.adjustPhase(phase)
      if (__DEV__ && adjustedPhase !== phase) console.warn('RESEARCH: phase has been adjusted', phase, adjustedPhase)
      console.log('scheduleEffects', phase, '-->', adjustedPhase, effects)
      this.useTaskQueue(adjustedPhase).scheduleEffects(effects)
   }

   scheduleTask(task: Task, phase: Phase) {
      const adjustedPhase = this.adjustPhase(phase)
      if (__DEV__ && adjustedPhase !== phase) console.warn('RESEARCH: phase has been adjusted', phase, adjustedPhase)
      this.useTaskQueue(adjustedPhase).scheduleTask(task)
   }

   subphase: 'effects' | 'tasks' = 'effects'

   adjustPhase(phase: Phase) {
      return this.currentPhase === phase ? phase
         : phase === SYNC ? this.currentPhase
            : this.currentPhase === SYNC ? phase : phase > this.currentPhase ? phase : this.currentPhase
      // TODO: phase adjustment for tick may be different... also, need to consider tasks that trigger effects and use subphases to adjust
   }
}



/**
 * Manages pausing and resuming of effects to prevent render-blocking
 */
export class CycleProcess {
   constructor(
      private update: Update,
   ) {

   }

   private gen!: Generator

   timeLeft() {
      return 5
   }

   resetTime() {
      const startTime = performance.now()
      this.timeLeft = () => {
         return 5 - (performance.now() - startTime)
      }
   }

   start(fn: () => Generator, genState: { paused: boolean, gen: Generator } = { paused: false, gen: undefined! }) {
      queueTask(() => {
         this.resetTime()
         this.runOuter(fn, genState)
      })
   }

   runSync(fn: () => Generator) {
      fn().next()
   }

   runOuter(fn: () => Generator, genState: { paused: boolean, gen: Generator }) {
      genState.gen = this.gen = fn()
      this.gen.next()
   }

   runNext(fn: () => Generator) {
      this.gen = fn()
      this.gen.next()
   }

   mustPause() {
      return this.timeLeft() < 0
   }

   prepOuterPause(genState: { paused: boolean, gen: Generator }, onResume: () => void) {
      genState.paused = true;
      if (this.gen === genState.gen) {
         // requestAnimationFrame(() => {
         genState.paused = false;
         this.resume(onResume)
         // })
      }
   }

   resumeOuter(genState: { paused: boolean, gen: Generator }, onResume: () => void) {
      this.gen = genState.gen;
      if (genState.paused)
         // requestAnimationFrame(() => {
         genState.paused = false;
      this.resume(onResume)
      // })
   }

   prepPause(onResume: () => void) {
      this.resume(onResume)
   }

   resume(onResume: () => void) {
      queueTask(() => {
         this.resetTime()
         onResume()
         this.gen.next()
      })
   }
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

type Task = () => void

let _prelude: Promise<void> | undefined = undefined
let _render: Promise<void> | undefined = undefined
let _postlude: Promise<void> | undefined = undefined
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

export function postlude() {
   const update = $activeUpdate()
   if (!update) return _postlude ?? (_postlude = new Promise<void>(resolve => {
      renderphase().then(() => {
         queueMicrotask(() => {
            _postlude = undefined
            resolve()
         })
      })
   }))
   return update.cycle.$effectsComplete(POSTLUDE)
}


export function tick() {
   const update = $activeUpdate()
   if (!update) return _tick ?? (_tick = new Promise<void>(resolve => {
      queueTask(() => {
         _tick = undefined
         resolve()
      })
   }))
   return update.cycle.$effectsComplete(TICK)
}


export function queuePrelude(task: Task) {
   $activeUpdate()?.cycle.scheduleTask(task, PRELUDE)
}

export function queueInternalRender(task: Task, flask: Flask) { // TODO: do other task schedulers also need flask??
   task
      //@ts-expect-error
      .__DEVName
      = 'queueInternalRender'
   task
      //@ts-expect-error
      .__DEVTrace
      = getInternalTrace('internal render')

   $activeUpdate()?.cycle.scheduleTask(() => {
      if (flask.discarded) return;
      task()
   }, INTERNAL_RENDER)
}


export function queueRender(task: Task) {
   $activeUpdate()?.cycle.scheduleTask(task, RENDER)
}

export function queuePostlude(task: Task) {
   $activeUpdate()?.cycle.scheduleTask(task, POSTLUDE)
}

export function onTick(task: Task) {
   $activeUpdate()?.cycle.scheduleTask(task, TICK)
}




// export const queueInternalRender = (fn: Function) => {
//    console.log('running internal render'),
//    fn()
// }


// export const queueInternalRender = useUpdateCycleScheduler(INTERNAL_RENDER)
// export const queueInternalPostrenderTask = useUpdateCycleScheduler(INTERNAL_POSTRENDER)
// export const queuePostlude = (task: () => void) => {
//    queueInternalPostrenderTask(postcycleTask(task))
// }


//NOTE: there may be multiple effect cycles per event
// queueEffect (onPrerender)
// afterEffects 
// 


// export function afterEffects<T extends (() => void) | undefined = undefined>(task?: T): T extends () => void ? void : Promise<void> {
//    if (task) {
//       onEventCycleEnd(task)
//       return undefined as T extends () => void ? void : Promise<void>
//    }
//    return effectsComplete() as T extends () => void ? void : Promise<void>
// }



// watch($active, async () => {
//    const { width } = measureWidth()

//    await renderphase()
//    column.width = width;

//    await postlude()
//    updateDatabase()

// })

// watch($active, () => {
//    const { width } = measureWidth()

//    onRender(() => {
//       column.width = width;
//    })

//    onPostlude(() => {
//       updateDatabase()
//    })
// })




// // await is good if you need to share state and 
// watch($active)
//    .beforeRender(() => {

//       const { width } = measureWidth()

//       await onRender()

//       column.width = width;

//       if (!something) return;

//       await afterRender()

//       updateDatabase()
//    })

// watch(() => {
//    if (!$active()) return;

//    const { width } = measureWidth()

//    await renderphase()
//    column.width = width;

//    if (!something) return;

//    await postlude()
//    updateDatabase()
// })

// watch($active, async () => {
//    await postlude()
//    doSomething()
// })



// watch($active, async () => {
//    const { width } = measureWidth()

//    watch($count, async () => {
//       await postlude({ cancel: onAbort })
//       column.width = width;
//    })
// }) // TODO: { sync: true } with batched as default, no phases. Phases will be the responsibility of the ui framework

// watch($active).beforeRender(() => {
//    const { width } = measureWidth()

//    await watch($count).afterRender()

//    column.width = width;
// })













// const $todoID = Ion('kldk')
// const $data = Ion()

// queueIonicTask(async w => {
//    await postlude()

//    if (w($active)) {

//    }
//    else {

//    }

//    const response = await fetch(`https://jsonplaceholder.typicode.com/todos/${w($todoID)}`)
//    $data.value = await response.json()
// })






// export const [
//    SYNC,
//    PRELUDE,
//    RENDER,
//    POSTLUDE,
//    COMPLETION
// ] = useReactivity([ //(default to queueTask for all phases)
//    definePhase('PRELUDE', (runPhase: VoidFunction) => queueMicrotask(() => queueMicrotask(runPhase))), // allows devs room to use queueMicrotask 
//    definePhase('RENDER', requestAnimationFrame),
//    definePhase('POSTLUDE', queueMicrotask)
// ])



// const PRELUDE = 'PRELUDE'
// const RENDER = 'RENDER'
// const POSTLUDE = 'POSTLUDE'



// watch($count, async () => {
//    await $render_phase();

//    await prelude(); // this would schedule to the next event's prelude? which may or may not be before or after the next render (depending on )
// })

// // TODO:
// // default phase: post-event
// // must use sync: true for sync

// watch($dog, async ({ state }) => {
//    const width = catEl.width + state

//    await $renderphase();
//    petsEl.width = width;

//    await postlude();
//    petsEl.focus()
// })

// queueIonicTask((w, initial) => {

// }, { phase: RENDER })

// // TODO: figure out updating ui vs updating database, e.g. animating drag, then posting final position to db

// function reMouseDown() {
//    listen('mousemove', e => {
//       doAction(UPDATE_POSITION, [e.clientX, e.clientY])
//    })

//    listen('mouseup', () => {
//       doAction(UPDATE_POSITION, [e.clientX, e.clientY])
//       const success = await dispatch(POST_POSITION, { x, y })
//       if (!success)
//          doAction(UPDATE_POSITION, [prevX, prevY])
//    })
// }

// watch($dog, async ({ state }) => {
//    const width = catEl.width + state

//    await $updatephase('db');
//    petsEl.width = width;

//    await $postupdate();
//    petsEl.focus()

//    await $updatecomplete();

// })

// watch($dog, async ({ state }) => {
//    const width = catEl.width + state

//    await $updatephase('db');
//    petsEl.width = width;

//    await $postupdate();
//    petsEl.focus()
// })

// const INSERT_TEXT = defineAction({
//    do(action) {
//       return (document, word, index) => {
//          action.snapshot(document, DEEP);
//          return document.insertText(word, index)
//       }
//    },
//    catch(err, action) {
//       action.rollback()
//    }
// })





// function reKeydown() {
//    const output = doAction(INSERT_TEXT, [2])
// }

// const INSERT_TEXT = defineAction({
//    name: 'insert-text',
//    do(action, document, word, index) {
//       action.snapshot(document, DEEP);
//       return document.insertText(word, index)
//    },
//    catch(err, action) {
//       action.rollback()
//    }
// })