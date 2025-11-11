

import { setImmediate } from "@rue/thread";
import { $activeUpdate, getActiveUpdate, Update } from "./Update"
import { Effect, EffectQueue, PreludeTaskQueue, TaskQueue, TickTaskQueue } from "./EffectQueue"
import { $schedule, Flask, getFlask, SchedulerOptions } from "@rue/flask"
import { getInternalTrace } from "../../../flask/debug"


export const queueTask = setImmediate;


function queueSwiftTask(task: Task) {
   return requestIdleCallback(task, { timeout: 17 })
}

export type Phase = typeof SYNC | AsyncPhase

type AsyncPhase =
   typeof PRELUDE
   | typeof INTERNAL_RENDER
   | typeof RENDER
   | typeof POSTLUDE


export const SYNC = 'SYNC'
export const PRELUDE = 0
export const INTERNAL_RENDER = 1
export const RENDER = 2
export const POSTLUDE = 3


type CyclePhase = {
   phase: AsyncPhase;
   scheduleEffects: (task: Task, update: Update) => void;
   scheduleTasks: (task: Task) => void;
}


function assertSequentialPhases(phases: CyclePhase[]) {
   let i = phases.length
   while (i--) {
      if (phases[i].phase !== i) {
         throw new Error('[RUE INTERNAL ERROR] phase numbers incorrect')
      }
   }
}




/**
 * @internal
 */
export class EffectCycle {

   currentPhase: Phase = SYNC

   phases: CyclePhase[]

   startTime = performance.now()

   constructor(
      public update: Update,
   ) {
      const schedulePrerenderTasks = update.idle ? queueSwiftTask : queueMicrotask
      const scheduleInternalRender = update.idle ? queueTask : queueMicrotask

      this.phases = [{
         phase: PRELUDE,
         scheduleEffects: queueMicrotask,
         scheduleTasks: schedulePrerenderTasks
      }, {
         phase: INTERNAL_RENDER,
         scheduleEffects: (runEffects, update) => scheduleInternalRender(() => { update.commit(); runEffects() }),
         scheduleTasks: queueMicrotask
      }, {
         phase: RENDER,
         scheduleEffects: queueMicrotask,
         scheduleTasks: queueMicrotask
      }, {
         phase: POSTLUDE,
         scheduleEffects: queueTask,
         scheduleTasks: queueSwiftTask
      }]

      if (__DEV__) assertSequentialPhases(this.phases)
   }

   started = false

   start() {
      console.log('starting cycle!')
      if (this.cancelled == true) return;
      this.runStartTasks()
      this.schedulePhase(this.phases[0]) // from module
   }

   private startTasks: (() => void)[] | undefined

   private runStartTasks() {
      this.startTasks?.forEach(task => {
         task()
      })
   }

   onStart(fn: () => void) {
      if (this.started) {
         fn()
      }
      else {
         const startTasks = this.startTasks ?? (this.startTasks = [])
         startTasks.push(fn)
      }
   }

   schedulePhase({ phase, scheduleEffects, scheduleTasks }: CyclePhase) {
      scheduleEffects(() => {
         console.log('running phase', phase)
         if (this.cancelled) return;
         this.currentPhase = phase
         this.subphase = 'effects'
         this.runEffects(phase, (beginTasks) => {
            scheduleTasks(() => {
               if (this.cancelled) return;
               this.subphase = 'tasks'
               beginTasks()
               queueMicrotask(() => {
                  this.closePhase(this.phases[phase + 1]) // TODO: instead of simple + 1, find the next existing phase
               })
            })
         })
      }, this.update)
   }

   runSyncEffects() {
      this.subphase = 'effects'
      this.runEffects(SYNC, (beginTasks) => {
         this.subphase = 'tasks'
         beginTasks()
      })
   }

   closePhase(nextPhase: CyclePhase | undefined) {
      if (nextPhase && !this.cancelled) {
         this.schedulePhase(nextPhase)
      }
      else if (__DEV__) {
         requestAnimationFrame((time) => this.timecheck(time))
      }
   }

   idleIDs: number[] = []

   cancelled: boolean = false;

   cancel() {
      this.idleIDs.forEach((id) => cancelIdleCallback(id))
      let i = this.phases.length
      while (i--) {
         this.effects[i]?.cancel()
      }
      this.cancelled = true;
   }

   timecheck(now: DOMHighResTimeStamp) {
      const delta = now - this.startTime
      const timeMargin = this.update.timeMargin
      if (timeMargin && delta > timeMargin) console.warn('Interaction-to-paint time exceeds', timeMargin, 'ms:', delta)
   }

   effects: { [key: number | string]: TaskQueue | undefined } = {
      [SYNC]: undefined,
      [PRELUDE]: undefined,
      [INTERNAL_RENDER]: undefined,
      [RENDER]: undefined,
      [POSTLUDE]: undefined,
      // [SYNC]: new TaskQueue(this, SYNC),
      // [PRELUDE]: new PreludeTaskQueue(this),
      // [INTERNAL_RENDER]: new TaskQueue(this, INTERNAL_RENDER),
      // [RENDER]: new TaskQueue(this, RENDER),
      // [POSTLUDE]: new TickTaskQueue(this),
   }
   // : Map<Phase, TaskQueue> = new Map(); // pass in an object to constructor instead of map

   // effectStack: Set<Effect> = new Set()

   // private initializeQueue(phase: Phase) {
   //    const queue: TaskQueue =
   //       phase === PRELUDE
   //          ? new PreludeTaskQueue(this)
   //          : new TaskQueue(this, phase)
   //    this.effects[phase] = queue;
   //    return queue
   // }

   useTaskQueue(phase: Phase) {
      return this.effects[phase]
         ?? (this.effects[phase] =
            phase === PRELUDE
               ? new PreludeTaskQueue(this)
               : phase === POSTLUDE
                  ? new TickTaskQueue(this)
                  : new TaskQueue(this, phase)
         )
   }

   $effectsComplete(phase: Phase) {
      return this.useTaskQueue(phase).effectsComplete;
   }

   scheduleEffects(effects: EffectQueue, phase: Phase) {
      const adjustedPhase = this.adjustPhase(phase)
      if (__DEV__ && adjustedPhase !== phase) console.warn('RESEARCH: phase has been adjusted', phase, adjustedPhase)
      // const queue = this.effects[adjustedPhase] ?? this.initializeQueue(adjustedPhase);
      this.useTaskQueue(adjustedPhase).scheduleEffects(effects)
   }

   scheduleTask(task: Task, phase: Phase) {
      this.useTaskQueue(phase).scheduleTask(task)
   }

   subphase: 'effects' | 'tasks' = 'effects'

   runningEffects: boolean = false;

   runEffects(phase: Phase, onComplete: (beginTasks: Function) => void) {
      return this.useTaskQueue(phase).runEffects(this, onComplete)
   }

   adjustPhase(phase: Phase) {
      return this.currentPhase === phase ? phase
         : phase === SYNC ? this.currentPhase
            : this.currentPhase === SYNC ? phase : phase > this.currentPhase ? phase : this.currentPhase
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
   return POSTLUDE;
}


export function getCurrentPhase() {
   const update = getActiveUpdate()
   if (!update) return SYNC;
   return update.cycle.currentPhase;
}

type Task = () => void

let prelude: Promise<void> | undefined = undefined
let render: Promise<void> | undefined = undefined
let tick: Promise<void> | undefined = undefined

function usePrerenderPromise() {
   return prelude ?? (prelude = new Promise<void>(resolve => {
      queueMicrotask(() => {
         prelude = undefined
         resolve()
      })
   }))
}


export function $prerender() {
   const update = $activeUpdate()
   if (!update) return usePrerenderPromise()
   return update.cycle.$effectsComplete(PRELUDE)
}


export function $render() {
   const update = $activeUpdate()
   if (!update) return render ?? (render = new Promise<void>(resolve => {
      usePrerenderPromise().then(() => {
         queueMicrotask(() => {
            render = undefined
            resolve()
         })
      })
   }))
   return update.cycle.$effectsComplete(RENDER)
}


export function $tick() {
   const update = $activeUpdate()
   if (!update) return tick ?? (tick = new Promise<void>(resolve => {
      queueTask(() => {
         tick = undefined
         resolve()
      })
   }))
   return update.cycle.$effectsComplete(POSTLUDE)
}


export function queuePrerenderTask(task: Task) {
   $activeUpdate()?.cycle.scheduleTask(task, PRELUDE)
}

export function queueInternalRenderTask(task: Task, flask: Flask) { // TODO: do other task schedulers also need flask??
   task
      //@ts-expect-error
      .__DEVName
      = 'queueInternalRenderTask'
   task
      //@ts-expect-error
      .__DEVTrace
      = getInternalTrace('internal render')
   $activeUpdate()?.cycle.scheduleTask(() => {
      if (flask.discarded) return;
      task()
   }, INTERNAL_RENDER)
}

export function queueRenderTask(task: Task) {
   $activeUpdate()?.cycle.scheduleTask(task, RENDER)
}

export function queuePostrenderTask(task: Task) {
   $activeUpdate()?.cycle.scheduleTask(task, POSTLUDE)
}




// export const queueInternalRenderTask = (fn: Function) => {
//    console.log('running internal render'),
//    fn()
// }


// export const queueInternalRenderTask = useUpdateCycleScheduler(INTERNAL_RENDER)
// export const queueInternalPostrenderTask = useUpdateCycleScheduler(INTERNAL_POSTRENDER)
// export const queuePostrenderTask = (task: () => void) => {
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

//    await $render()
//    column.width = width;

//    await $postlude()
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













// const $todoID = ion('kldk')
// const $data = ion()

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

//    await $prelude(); // this would schedule to the next event's prelude? which may or may not be before or after the next render (depending on )
// })

// // TODO:
// // default phase: post-event
// // must use sync: true for sync

// watch($dog, async ({ state }) => {
//    const width = catEl.width + state

//    await $renderphase();
//    petsEl.width = width;

//    await $postrender();
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