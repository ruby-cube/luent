import { Reactions } from "./Atom";
import { Reaction } from "./Reaction";
import { $activeUpdate, getActiveUpdate, popUpdate, pushUpdate, Update } from "./Update";

export const queueTask = (task: () => void) => scheduler.postTask(task);


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
//     atPrelude(() => {
//       const prelude = _prelude
//       _prelude = undefined
//       resolve()
//       return prelude;
//     })
//   }))
// }

// export function $render() {
//   return _render ?? (_render = new Promise<void>(resolve => {
//     atRender(() => {
//       const render = _render
//       _render = undefined
//       resolve()
//       return render;
//     })
//   }))
// }

// export function $layout() {
//   return _layout ?? (_layout = new Promise<void>(resolve => {
//     atLayout(() => {
//       const layout = _layout
//       _layout = undefined
//       resolve()
//       return layout;
//     })
//   }))
// }

export const prelude = new PhasePromise(atPrelude)
export const render = new PhasePromise(atRender)
export const layout = new PhasePromise(atLayout)
export const tick = new PhasePromise(atTick)




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




export function atPrelude(task: Task) {
  $activeUpdate()?.cycle.scheduleTask(task, PRELUDE)
}

export function atInternalRender(task: Task) {
  $activeUpdate()?.cycle.scheduleTask(task, INTERNAL_RENDER)
}

export function atRender(task: Task) {
  $activeUpdate()?.cycle.scheduleTask(task, RENDER)
}

export function atLayout(task: Task) {
  $activeUpdate()?.cycle.scheduleTask(task, LAYOUT)
}

export function atTick(task: Task) {
  requestAnimationFrame(() => {
    queueTask(task)
  })
}
