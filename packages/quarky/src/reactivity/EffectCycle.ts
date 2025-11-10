

import { noop } from "@rue/utils"
import { $activeUpdate, getActiveUpdate, queueTask, Update } from "./Update"
import { Effect, EffectQueue, PrerenderTaskQueue, TaskQueue, TickTaskQueue } from "./EffectQueue"
import { $schedule, Flask, getFlask, SchedulerOptions } from "@rue/flask"
import { IonSubstance } from "./Substance"
import { Ion } from "../ion/Ion"
import { scheduleEagerEffect } from "./watch"
import { getInternalTrace } from "../../../flask/debug"

function queueSwiftTask(task: Task) {
   return requestIdleCallback(task, { timeout: 17 })
}

export type Phase = typeof SYNC | AsyncPhase

type AsyncPhase =
   typeof PRERENDER
   | typeof INTERNAL_RENDER
   | typeof RENDER
   | typeof POSTRENDER


export const SYNC = 'SYNC'
export const PRERENDER = 0
export const INTERNAL_RENDER = 1
export const RENDER = 2
export const POSTRENDER = 3


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

      const scheduleInternalRender = update.idle ? queueTask : queueMicrotask
      const schedulePrerenderTasks = update.idle ? queueSwiftTask : queueMicrotask

      this.phases = [{
         phase: PRERENDER,
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
         phase: POSTRENDER,
         scheduleEffects: queueTask,
         scheduleTasks: queueSwiftTask
      }]

      if (__DEV__) assertSequentialPhases(this.phases)
   }

   started = false

   start() {
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
                  this.closePhase(this.phases[phase + 1])
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
      [PRERENDER]: undefined,
      [INTERNAL_RENDER]: undefined,
      [RENDER]: undefined,
      [POSTRENDER]: undefined,
      // [SYNC]: new TaskQueue(this, SYNC),
      // [PRERENDER]: new PrerenderTaskQueue(this),
      // [INTERNAL_RENDER]: new TaskQueue(this, INTERNAL_RENDER),
      // [RENDER]: new TaskQueue(this, RENDER),
      // [POSTRENDER]: new TickTaskQueue(this),
   }
   // : Map<Phase, TaskQueue> = new Map(); // pass in an object to constructor instead of map

   // effectStack: Set<Effect> = new Set()

   // private initializeQueue(phase: Phase) {
   //    const queue: TaskQueue =
   //       phase === PRERENDER
   //          ? new PrerenderTaskQueue(this)
   //          : new TaskQueue(this, phase)
   //    this.effects[phase] = queue;
   //    return queue
   // }

   useTaskQueue(phase: Phase) {
      return this.effects[phase]
         ?? (this.effects[phase] =
            phase === PRERENDER
               ? new PrerenderTaskQueue(this)
               : phase === POSTRENDER
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
   return POSTRENDER;
}


export function getCurrentPhase() {
   const update = getActiveUpdate()
   if (!update) return SYNC;
   return update.cycle.currentPhase;
}

type Task = () => void

// export function maybePostcycleTask(task: Task, phase: Phase) {
//    return phase === CyclePhase.phases.length ? postcycleTask(task) : task;
// }

// export function postcycleTask(task: Task) {
//    function delayed() { // TODO: need to cancel with action
//       const id = requestIdleCallback(task, { timeout: 18 })
//       // $action().onCancel(()=>cancelIdleCallback(id))
//    }
//    if (__DEV__) delayed.__DEV__fn = task;
//    return delayed;
// }


let prerender: Promise<void> | undefined = undefined
let render: Promise<void> | undefined = undefined
let tick: Promise<void> | undefined = undefined

function usePrerenderPromise() {
   return prerender ?? (prerender = new Promise<void>(resolve => {
      queueMicrotask(() => {
         prerender = undefined
         resolve()
      })
   }))
}


export function $prerender() {
   const update = $activeUpdate()
   if (!update) return usePrerenderPromise()
   return update.cycle.$effectsComplete(PRERENDER)
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
   return update.cycle.$effectsComplete(POSTRENDER)
}


export function queuePrerenderTask(task: Task) {
   $activeUpdate()?.cycle.scheduleTask(task, PRERENDER)
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
   $activeUpdate()?.cycle.scheduleTask(task, POSTRENDER)
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






/**
 * Optimized barebones ion-only watch function. links effect to atoms and flask. No async context used.
 * @param ion 
 * @param render 
 * @param eager 
 * @returns 
 */
export function watchToRender<T>(ion: Ion<T>, render: (state: { current: T, previous: T, flask: Flask, eagerRun: boolean }) => void, phase: typeof PRERENDER | typeof INTERNAL_RENDER = INTERNAL_RENDER, flask: Flask = getFlask(), eager: boolean = false) {
   // watch(ion, (e)=>render({current: e.current, previous: e.previous, flask: getActiveFlask()}), {phase: PRERENDER, eager})
   // return;
   const subject = new IonSubstance(ion)

   let prevState = subject.getValue()

   if (!subject.reactive) {
      return;
   }

   let stale = false;
   let paused = false;

   const effect = new Effect(() => {
      if (paused) {
         stale = true;
         return;
      }
      stale = false;
      _render()
   }, phase)

   let eagerRun = eager;

   function _render() {
      const newState = subject.getValue()
      render({ current: newState, previous: prevState, flask, eagerRun })
      eagerRun = false;
      prevState = newState;
   }

   if (eager) {
      scheduleEagerEffect(_render, PRERENDER)
   }

   subject.linkEffect(effect)

   flask.onDiscard(/* listener.stop */() => {
      effect.destroy()
   });
   flask.onDemount(/* listener.pause */() => {
      paused = true;
   });
   flask.onRemount(/* listener.resume */() => {
      paused = false;
      if (stale) {
         effect.run?.()
      }
   });
}

export const RUN_EAGERLY = true;








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