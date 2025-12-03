import { createStack } from "@rue/utils";
import { INTERNAL_RENDER, PRELUDE, queueTask, RenderCycle } from "./RenderCycle";
import { UpdateType } from "./LazyUpdate";

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
      public timeMargin = 100,
      public idle: number | boolean = 50
   ) {
   }

   private tasks: (() => void)[] = []

   queue(task: () => void) {
      if (this.started) {
         try {
            pushUpdate(this)
            task()
         }
         finally {
            popUpdate()
         }
      }
      else {
         this.tasks.push(task)
      }
   }

   _cycle?: RenderCycle

   get cycle() {
      // console.trace('get cycle')
      return this._cycle ?? (this._cycle = new RenderCycle(this))
   }

   private started = false;

   start() {
      if (this.started) return;
      this.started = true

      try {
         pushUpdate(this)
         for (const task of this.tasks) {
            task()
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
      this.emitter.dispatchEvent(this.commitUpdate!)
   }

   private emitter: EventTarget = new EventTarget()

   private COMMIT = 'commit'

   private commitUpdate: Event = new Event(this.COMMIT)

   atCommit(task: () => void) {
      this.emitter.addEventListener(this.COMMIT, task)
   }

   completed = false;

   complete() {
      this.completed = true;
      this.emitter.dispatchEvent(this.completeUpdate)
   }

   private COMPLETE = 'complete'

   private completeUpdate: Event = new Event(this.COMPLETE)

   atComplete(task: () => void) {
      this.emitter.addEventListener(this.COMPLETE, task)
   }

   // disallows new update tasks
   get closed() {
      const taskqueues = this.cycle.effects
      if (taskqueues[PRELUDE]) return taskqueues[PRELUDE].started
      return taskqueues[INTERNAL_RENDER]!.started
   }
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
      console.warn('queueing update')
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
   createInstantUpdate().queue(task)
}

function createInstantUpdate() {
   return new Update(UpdateType.USER_ANIMATION, 16.7, false).start()!
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
export function tickUpdate(fn: () => void, origin: Update): void { // TODO: base tick update on original update?
   const update = createSwiftUpdate()
   // new Update(
   //    origin.type,
   //    origin.timeMargin,
   //    origin.type === UpdateType.USER_INTERACTION ? false : origin.idle
   // )
   update.queue(fn)
}
