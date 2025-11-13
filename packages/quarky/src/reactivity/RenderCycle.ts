

import { setImmediate } from "@rue/thread";
import { $activeUpdate, catchCancelledUpdate, getActiveUpdate, Update } from "./Update"
import { EffectQueue, PreludeTaskQueue, TaskQueue, TickTaskQueue } from "./EffectQueue"
import { Flask } from "@rue/flask"
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
   | typeof TICK


export const SYNC = 'SYNC'
export const PRELUDE = 0
export const INTERNAL_RENDER = 1
export const RENDER = 2
export const POSTLUDE = 3
export const TICK = 4


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
export class RenderCycle {

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
         scheduleEffects: queueMicrotask,
         scheduleTasks: queueMicrotask
      }, {
         phase: TICK,
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
      return this.update.completed
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
         if (this.cancelled) return;
         this.currentPhase = phase
         this.subphase = 'effects'
         this.runEffects(phase, (beginTasks) => {
            scheduleTasks(() => {
               if (this.cancelled) return;
               this.subphase = 'tasks'
               beginTasks()
               queueMicrotask(() => {
                  this.closePhase(phase)
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

   closePhase(phase: AsyncPhase) {
      const nextPhase = this.phases[phase + 1]
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
      try {
         this.idleIDs.forEach((id) => cancelIdleCallback(id))
         let i = this.phases.length
         while (i--) {
            this.effects[i]?.cancel()
         }
         this.cancelled = true;
      }
      catch (error) {
         console.log('CATCH', error)
      }
   }

   timecheck(now: DOMHighResTimeStamp) {
      const delta = now - this.startTime
      const timeMargin = this.update.timeMargin
      if (timeMargin && delta > timeMargin) {
         // console.warn('Interaction-to-paint time exceeds', timeMargin, 'ms:', delta)
      }
   }

   effects: { [key: number | string]: TaskQueue | undefined } = {
      [SYNC]: undefined,
      [PRELUDE]: undefined,
      [INTERNAL_RENDER]: new TaskQueue(this, INTERNAL_RENDER),
      [RENDER]: undefined,
      [POSTLUDE]: undefined,
      [TICK]: new TickTaskQueue(this)
   }

   // effectStack: Set<Effect> = new Set()

   useTaskQueue(phase: Phase) {
      return this.effects[phase]
         ?? (this.effects[phase] =
            phase === PRELUDE
               ? new PreludeTaskQueue(this)
               : new TaskQueue(this, phase)
         )
   }

   onCompleted(fn: () =>void) {
      this.$effectsComplete(TICK).then(fn)
   }

   $effectsComplete(phase: Phase) {
      return this.useTaskQueue(phase).effectsComplete;
   }

   scheduleEffects(effects: EffectQueue, phase: Phase) {
      const adjustedPhase = this.adjustPhase(phase)
      if (__DEV__ && adjustedPhase !== phase) console.warn('RESEARCH: phase has been adjusted', phase, adjustedPhase)
      this.useTaskQueue(adjustedPhase).scheduleEffects(effects)
   }

   scheduleTask(task: Task, phase: Phase) {
      this.useTaskQueue(phase).scheduleTask(task)
   }

   subphase: 'effects' | 'tasks' = 'effects'

   runningEffects: boolean = false;

   runEffects(phase: Phase, onComplete: (beginTasks: Function) => void) {
      const queue = this.effects[phase]
      if (queue) {
         queue.runEffects(this, onComplete)
      }
      else if (phase !== SYNC) {
         this.closePhase(phase)
      }
   }

   adjustPhase(phase: Phase) {
      return this.currentPhase === phase ? phase
         : phase === SYNC ? this.currentPhase
            : this.currentPhase === SYNC ? phase : phase > this.currentPhase ? phase : this.currentPhase // TODO: phase adjustment for tick may be different...
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




export function $prelude() {
   const update = $activeUpdate()
   if (!update) return _prelude ?? (_prelude = new Promise<void>(resolve => {
      queueMicrotask(() => {
         _prelude = undefined
         resolve()
      })
   }))
   return update.cycle.$effectsComplete(PRELUDE)
}


export function $render() {
   const update = $activeUpdate()
   if (!update) return _render ?? (_render = new Promise<void>(resolve => {
      $prelude().then(() => {
         queueMicrotask(() => {
            _render = undefined
            resolve()
         })
      })
   }))
   return update.cycle.$effectsComplete(RENDER)
}

export function $postlude() {
   const update = $activeUpdate()
   if (!update) return _postlude ?? (_postlude = new Promise<void>(resolve => {
      $render().then(() => {
         queueMicrotask(() => {
            _postlude = undefined
            resolve()
         })
      })
   }))
   return update.cycle.$effectsComplete(POSTLUDE)
}


export function $tick() {
   const update = $activeUpdate()
   if (!update) return _tick ?? (_tick = new Promise<void>(resolve => {
      queueTask(() => {
         _tick = undefined
         resolve()
      })
   }))
   return update.cycle.$effectsComplete(TICK)
}


export function queuePreludeTask(task: Task) {
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

export function queueRenderTask(task: Task) {
   $activeUpdate()?.cycle.scheduleTask(task, RENDER)
}

export function queuePostludeTask(task: Task) {
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
// export const queuePostludeTask = (task: () => void) => {
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

//    await $postlude();
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