import { $_run_with_, $_snap_context, $_wrap_with_context } from "@luently/flask";
import { Reactions } from "./Atom";
import { Reaction } from "./Reaction";
import { $activeUpdate, getActiveUpdate, popUpdate, pushUpdate, Update } from "./Update";

type PostTaskCallback = () => void | Promise<void>

type SchedulerLike = {
  postTask?: (task: PostTaskCallback) => Promise<void> | void
}

const postTaskFallback = (task: PostTaskCallback) =>
  postMessageScheduler(task)

const postMessageScheduler = (() => {
  const channel = typeof window !== 'undefined' ? window : undefined
  const messageKey = `__quarky_posttask_${Math.random().toString(36).slice(2)}`
  let scheduled = false
  let queue: Array<() => void> = []

  const flush = () => {
    scheduled = false
    const pending = queue
    queue = []
    for (const run of pending) {
      run()
    }
  }

  if (channel) {
    channel.addEventListener('message', (event) => {
      if (event.source === channel && event.data === messageKey) {
        flush()
      }
    })
  }

  return (task: PostTaskCallback) =>
    new Promise<void>((resolve, reject) => {
      queue.push(() => {
        Promise.resolve()
          .then(task)
          .then(() => resolve(), reject)
      })

      if (scheduled) return
      scheduled = true

      if (channel) {
        channel.postMessage(messageKey, '*')
      }
      else {
        setTimeout(flush, 0)
      }
    })
})()

export const queueTask = (task: PostTaskCallback) => {
  const schedulerApi = (globalThis as typeof globalThis & { scheduler?: SchedulerLike }).scheduler
  if (typeof schedulerApi?.postTask === 'function') {
    return schedulerApi.postTask(task)
  }
  return postTaskFallback(task)
};


type Task = () => void | Promise<void>

// [X] run sync reactions
// [X] skip reactions that have already been run *** (completed.has(reaction) for each round)
// [X] make sure Reactions of TrackedAtoms don't get queued multiple times
// [X] run tick reactions
// [X] phase management
// [X] initialize lazily
// --
// [] manage precommit vs postcommit + generator
// [] phases as promises
// [] infinite loop detection/prevention

export enum Phase {
  SYNC = 's',
  PRELUDE = 'p',
  INTERNAL_RENDER = 'ir',
  RENDER = 'r',
  LAYOUT = 'l',
  TICK = 't'
}

export const { LAYOUT, PRELUDE, INTERNAL_RENDER, RENDER, SYNC, TICK } = Phase

export const phaseKeys = [SYNC, PRELUDE, INTERNAL_RENDER, RENDER, LAYOUT, TICK]


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
    return this.phases[PRELUDE]?.more || this.phases[RENDER]?.more || this.phases[INTERNAL_RENDER]?.more || this.phases[LAYOUT]?.more
  }

  started = false

  loop = 0;

  async start() {
    this.started = true;
    while (this.more) {
      this.loop++;

      this.currentPhase = PRELUDE
      const prelude = this.phases[PRELUDE]
      if (prelude) await this.runPhase(prelude)

      if (this.loop === 1) {
        this.update.commit()
        pushUpdate(this.update)
      }

      this.currentPhase = INTERNAL_RENDER
      const internalRender = this.phases[INTERNAL_RENDER]
      if (internalRender) await this.runPhase(internalRender)

      this.currentPhase = LAYOUT
      const layout = this.phases[LAYOUT]
      if (layout) await this.runPhase(layout)

      this.currentPhase = RENDER
      const render = this.phases[RENDER]
      if (render) await this.runPhase(render)

    }
    if (!this.update.committed) this.update.commit()

    this.currentPhase = TICK
    this.runReactions(TICK)

    this.update.complete()
    popUpdate()
    if (__DEV__ && typeof window != 'undefined') {
      requestAnimationFrame((time) =>
        this.timecheck(time)
      )
    }
  }

  startTime = performance.now()

  timecheck(now: DOMHighResTimeStamp) {
    const delta = now - this.startTime
    const timeMargin = this.update.timeMargin
    if (__DEV__)
      if (timeMargin && delta > timeMargin) {
        if (timeMargin !== 16.7) console.log('Interaction-to-paint time exceeds', timeMargin, 'ms:', delta)
      }
      else {
        if (timeMargin === Infinity) console.log('passed timecheck', timeMargin, delta)
      }
  }

  async runPhase(phase: CycledPhase) {
    let reactions = phase.reactions
    phase.reactions = []

    let tasks: WrappedTask[] = phase.tasks
    phase.tasks = []

    let loop = 0
    while (reactions.length || tasks.length) {
      loop++
      const ran: Set<Reaction> = new Set()
      for (const queue of reactions) {
        queue.runReactions(ran, this.update)
      }
      for (const task of tasks) {
        const output = task(this.update)
        if (output instanceof Promise) {
          await output;
        }
      }
      reactions = phase.reactions
      tasks = phase.tasks
      phase.reactions = []
      phase.tasks = []
    }

  }

  scheduleReactions(reactions: Reactions, phase: Phase) {
    this.getPhase(phase).scheduleReactions(reactions)
  }

  scheduleTask(task: Task, phase: Phase.LAYOUT | Phase.PRELUDE | Phase.RENDER | Phase.INTERNAL_RENDER | Phase.TICK) {
    if (phase === TICK) requestAnimationFrame(() => queueTask(task))
    else (this.getPhase(phase) as CycledPhase).scheduleTask(task)
  }

  runReactions(phaseKey: Phase.SYNC | Phase.TICK) {
    const phase = this.phases[phaseKey]
    if (!phase) return;
    let reactions = phase.reactions
    phase.reactions = []

    while (reactions.length) {
      const ran: Set<Reaction> = new Set()
      for (const queue of reactions) {
        queue.runReactions(ran, this.update)
      }
      reactions = phase.reactions
      phase.reactions = []
    }
  }

  // runTickReactions() {
  //    const phase = this.phases[TICK]
  //    if (!phase) return;
  //    let reactions = phase.reactions
  //    phase.reactions = []

  //    while (reactions.length) {
  //       const ran: Set<Reaction> = new Set()
  //       for (const queue of reactions) {
  //          queue.runReactions(ran, this.update)
  //       }
  //       reactions = phase.reactions
  //       phase.reactions = []
  //    }
  // }
}


class BasePhase {
  reactions: Reactions[] = []

  get more() {
    return this.reactions.length
  }

  constructor(
    public phase: Phase
  ) { }

  scheduleReactions(reactions: Reactions) {
    if (!this.queued(reactions)) {
      this.reactions.push(reactions)
    }
  }

  queued(reactions: Reactions) {
    return this.reactions.indexOf(reactions) > -1
  }
}

type WrappedTask = (update: Update) => Promise<void> | void

class CycledPhase extends BasePhase {
  tasks: WrappedTask[] = []

  get more() {
    return this.reactions.length || this.tasks.length
  }

  constructor(
    public phase: Phase
  ) {
    super(phase)
  }

  scheduleTask(task: Task) {
    this.tasks.push((update: Update) => {
      try {
        pushUpdate(update)
        return task()
      }
      finally {
        popUpdate()
      }
    })
  }
}

const phaseClasses = {
  [SYNC]: BasePhase,

  [PRELUDE]: CycledPhase,
  [INTERNAL_RENDER]: CycledPhase,
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


class PhasePromise implements Promise<void> {
  get [Symbol.toStringTag]() {
    return "PhasePromise";
  }

  constructor(private schedule: (task: Task) => void) { }

  then<TResult1 = void, TResult2 = never>(
    onfulfilled?: ((value: void) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return new Promise<TResult1 | TResult2>((resolve, reject) => {
      const handleRejected = (reason: any) => {
        if (!onrejected) {
          reject(reason)
          return;
        }
        Promise.resolve(onrejected(reason)).then(resolve, reject)
      }

      try {
        this.schedule(() => {
          try {
            Promise.resolve(onfulfilled ? onfulfilled(undefined) : (undefined as TResult1)).then(resolve, handleRejected)
          }
          catch (err) {
            handleRejected(err)
          }
        })
      }
      catch (err) {
        handleRejected(err)
      }
    })
  }

  catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null): Promise<void | TResult> {
    return this.then<void, TResult>(undefined, onrejected)
  }

  finally(onfinally?: (() => void) | null): Promise<void> {
    const runFinally = () => Promise.resolve(onfinally?.()).then(() => undefined)

    return this.then<void, never>(
      () => runFinally(),
      (reason) => runFinally().then(() => {
        throw reason
      }),
    )
  }
}


// export function $prelude() {
//   return _prelude ?? (_prelude = new Promise<void>(resolve => {
//     awaitPrelude(() => {
//       const prelude = _prelude
//       _prelude = undefined
//       resolve()
//       return prelude;
//     })
//   }))
// }

// export function $render() {
//   return _render ?? (_render = new Promise<void>(resolve => {
//     awaitRender(() => {
//       const render = _render
//       _render = undefined
//       resolve()
//       return render;
//     })
//   }))
// }

// export function $layout() {
//   return _layout ?? (_layout = new Promise<void>(resolve => {
//     awaitLayout(() => {
//       const layout = _layout
//       _layout = undefined
//       resolve()
//       return layout;
//     })
//   }))
// }

export const prelude = new PhasePromise(awaitPrelude)
export const render = new PhasePromise(awaitRender)
export const layout = new PhasePromise(awaitLayout)
export const tick = new PhasePromise(awaitTick)




// export function $tick() {
//   return _tick ?? (_tick = new Promise<void>(resolve => {
//     requestAnimationFrame(() => {
//       queueTask(() => {
//         const tick = _tick
//         _tick = undefined
//         resolve()
//         return tick;
//       })
//     })
//   }))
// }




export function awaitPrelude(task: Task) {
  $activeUpdate()?.cycle.scheduleTask(task, PRELUDE)
}

export function queueInternalRender(task: Task) {
  $activeUpdate()?.cycle.scheduleTask(task, INTERNAL_RENDER)
}

export function awaitRender(task: Task) {
  $activeUpdate()?.cycle.scheduleTask(task, RENDER)
}

export function awaitLayout(task: Task) {
  $activeUpdate()?.cycle.scheduleTask(task, LAYOUT)
}

export function awaitTick(task: Task) {
  const _task = $_wrap_with_context(task)
  requestAnimationFrame(() => {
    queueTask(_task)
  })
}
