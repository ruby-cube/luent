import { createStack } from "@rue/utils";
import { INTERNAL_RENDER, PRELUDE, queueTask, RenderCycle } from "./RenderCycle";
import { UpdateType } from "./x_IdleUpdate";

export const [pushUpdate, popUpdate, getActiveUpdate] = createStack<Update>()


export function $activeUpdate() {
   const update = getActiveUpdate()
   if (!update && __DEV__) throw new Error('Must be called within update context')
   return update;
}

export class Update {
   timestamp: number = performance.now()

   constructor(
      public type: UpdateType = UpdateType.USER_INTERACTION,
      // public timeMargin = 1000, // FIX: TEMPORARY for sierpinski test
      // public idle: number | boolean = 1000
      public timeMargin = 100,
      public idle: boolean = true
   ) {
   }

   private tasks: (() => void)[] = []

   output: any

   queue(task: () => any) {
      if (this.started) {
         try {
            pushUpdate(this)
            this.output = task()
         }
         finally {
            popUpdate()
         }
      }
      else {
         this.tasks.push(task)
      }
      return this
   }

   _cycle?: RenderCycle

   get cycle() {
      // console.trace('get cycle')
      return this._cycle ?? (this._cycle = new RenderCycle(this))
   }

   private started = false;

   start() {
      if (this.started) return this;
      this.started = true

      try {
         pushUpdate(this)
         for (const task of this.tasks) {
            this.output = task()
         }
      }
      finally {
         popUpdate()
         // if (this._cycle)
         // if () // TODO: only start cycle if there were any state changes
         this.cycle.start()
      }
      return this
   }

   committed = false

   commit() {
      this.committed = true
      this.cast('commit')
      // this.emitter.dispatchEvent(this.commitUpdate!)
   }

   private cast(hook: 'commit' | 'complete') {
      const tasks = this.hooks[hook]

      for (const task of tasks) {
         task()
      }
   }

   private hooks = {
      commit: [] as (() => void)[],
      complete: [] as (() => void)[],
   }

   // private emitter: EventTarget = new EventTarget()

   // private COMMIT = 'commit'

   // private commitUpdate: Event = new Event(this.COMMIT)

   atCommit(task: () => void) {
      this.hooks.commit.push(task)
      // this.emitter.addEventListener(this.COMMIT, task)
   }

   completed = false;

   complete() {
      this.completed = true;
      this.cast('complete')
      // this.emitter.dispatchEvent(this.completeUpdate)
   }

   // private COMPLETE = 'complete'

   // private completeUpdate: Event = new Event(this.COMPLETE)

   atComplete(task: () => void) {
      this.hooks.complete.push(task)
      // this.emitter.addEventListener(this.COMPLETE, task)
   }

   // disallows new update tasks
   get closed() {
      const taskqueues = this.cycle.effects
      if (taskqueues[PRELUDE]) return taskqueues[PRELUDE].started
      return taskqueues[INTERNAL_RENDER]!.started
   }

   race(rival: Update | null, ...info: any[]) { // TODO: use algorithim based on type of update to determine whether to queue, drop, override. Currently this overrides
      if (rival === null || rival === this) {
         return;
      }
      if (rival) {
         // console.warn('[DEV RESEARCH] RACE CONDITION!!!!')
         console.log(...info)
         // if (!this.handleRace) {
         //    this.raceByType(rival)
         // }
         // else {
         //    this.handleRace(rival.asAction)
         // }
         // if (this.cancelled) throw new UpdateCancelled()
      }
   }
}


export function SlowUpdate<T>(fn: (...args: any[]) => T): () => Promise<T> {
   return (...args) => {
      return slowUpdate(fn)
   }
}

// FIX: temporary ... I think we should just create LongUpdate or Action (should there be a distinction?)
export function slowUpdate(task: () => any): Promise<any> {
   return (getLazyUpdate() ?? createLazyUpdate()).queue(task)
}

let latestLazyUpdate: Update | null = null

function getLazyUpdate() {
   if (latestLazyUpdate) {
      if (latestLazyUpdate.closed) {
         return;
      }
      return latestLazyUpdate;
   }
   return;
}

function createLazyUpdate() {
   const update = new Update(
      undefined,
      Infinity,
      true
   )
   if (latestLazyUpdate && !latestLazyUpdate.completed) {
      // console.warn('queueing update')
      latestLazyUpdate.atComplete(() => {
         queueTask(() => update.start())
      })
   }
   else {
      update.start() // TODO: only start if there are any state mutations
   }
   latestLazyUpdate = update
   return update
}

export let initialLoad: Update | null = null
export let load = (task: () => unknown) => {
   const update = initialLoad = new Update(undefined, 1000, true)
   update.queue(task)
   update.atComplete(() => {
      load = (fn: Function) => fn()
      initialLoad = null;
   })
   update.start()
}

export function swiftUpdate(task: () => unknown) {
   (getSwiftUpdate() ?? createSwiftUpdate()).queue(task)
}

let latestSwiftUpdate: Update | null = null

function getSwiftUpdate() {
   if (latestSwiftUpdate) {
      if (latestSwiftUpdate.closed) {
         return;
      }
      return latestSwiftUpdate;
   }
   return;
}

function createSwiftUpdate() {
   const update = new Update()
   if (latestSwiftUpdate && !latestSwiftUpdate.completed) {
      // console.warn('queueing update')
      latestSwiftUpdate.atComplete(() => {
         queueTask(() => update.start())
      })
   }
   else {
      update.start() // TODO: only start if there are any state mutations
   }
   latestSwiftUpdate = update
   return update
}


// NORMAL UPDATE
// - start() no functions run
// - queue() run function
// - + queue() run function


// QUEUED UPDATE
// - queue tasks...
// - atComplete: start() runs functions
// - queue() run function

export function instantUpdate(task: () => unknown) {
   return createInstantUpdate().queue(task).start()?.output
}

function createInstantUpdate() {
   return new Update(UpdateType.USER_ANIMATION, 16.7, false)
}


// export function instantUpdate(task: () => unknown) {
//    (getInstantUpdate() ?? createInstantUpdate()).queue(task)
// }

// let latestInstantUpdate: Update | null = null

// function getInstantUpdate() {
//    if (latestInstantUpdate) {
//       if (latestInstantUpdate.closed) {
//          return;
//       }
//       return latestInstantUpdate;
//    }
//    return;
// }

// function createInstantUpdate() {
//    console.log('* new update')
//    const update = new Update(UpdateType.USER_ANIMATION, 16.7, false)
//    if (latestInstantUpdate && !latestInstantUpdate.completed) {
//       console.warn('queueing update')
//       latestInstantUpdate.atComplete(() => {
//          queueTask(() => update.start())
//       })
//    }
//    else {
//       update.start() // TODO: only start if there are any state mutations
//    }
//    latestInstantUpdate = update
//    return update
// }

/**
 * tickUpdates will be initialized as a new task after 
 * @param fn 
 * @param origin 
 */
export function tickUpdate(fn: () => void, origin: Update): void {
   const update = new Update(
      origin.type,
      origin.timeMargin,
      origin.type === UpdateType.USER_INTERACTION ? false : origin.idle // TODO: not sure about this
   )
   update.queue(fn)
}
