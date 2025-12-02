import { INTERNAL_RENDER, PRELUDE, queueTask, RenderCycle } from "./RenderCycle";
import { popUpdate, pushUpdate, UpdateType } from "./Update";

export class Update {
   timestamp: number = Date.now()

   constructor(
      public type: UpdateType = UpdateType.USER_INTERACTION,
      public timeMargin = 100,
      public idle = 50
   ) {
      console.trace('new update')
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
      else this.tasks.push(task)
   }

   private _cycle?: RenderCycle
   get cycle() {
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
         this.cycle.start()
      }
   }

   committed = false

   commit() {
      console.trace('commit')
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
      console.log('taskqueues', taskqueues)
      if (taskqueues[PRELUDE]) return taskqueues[PRELUDE].started
      return taskqueues[INTERNAL_RENDER]!.started
   }
}



export function swiftUpdate(task: () => unknown) {
   console.log('SWIFT UPDATE');
   (getSwiftUpdate() ?? createSwiftUpdate()).queue(task)
}

let latestSwiftUpdate: Update | null = null

function getSwiftUpdate() {
   if (latestSwiftUpdate) {
      if (latestSwiftUpdate.closed) {
         console.log('update closed')
         return;
      }
      return latestSwiftUpdate;
   }
   return;
}

function createSwiftUpdate() {
   const update = new Update()
   if (latestSwiftUpdate && !latestSwiftUpdate.completed) {
      latestSwiftUpdate.atComplete(() => {
         console.warn('queueing update')
         queueTask(() => update.start())
      })
   }
   else {
      update.start()
   }
   latestSwiftUpdate = update
   return update
}


export function instantUpdate(fn: () => void) {
   // return 
   runUpdate(new Update(fn, UpdateType.INSTANT, 16.7))
}


/**
 * tickUpdates will be initialized as a new task after 
 * @param fn 
 * @param origin 
 */
export function tickUpdate(fn: () => void, origin: Update): void {
   const update = createSwiftUpdate()
   // new Update(
   //    origin.type,
   //    origin.timeMargin,
   //    origin.type === UpdateType.USER_INTERACTION ? false : origin.idle
   // )
   update.queue(fn)
   // try {
   //    pushUpdate(update)
   //    fn()
   // }
   // // catch (error) {
   // //    catchCancelledUpdate(error)
   // // }
   // finally {
   //    // NOTE: I'm worried about the chaos not running popUpdate synchronously will cause, but it's the only way to wrap an await's 'then' :(
   //    queueMicrotask(() => {
   //       popUpdate()
   //    })
   //    if (!update.cancelled) {
   //       update.cycle.start()
   //    }
   // }
}
