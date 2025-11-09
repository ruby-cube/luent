import { setImmediate } from "@rue/thread";
import { createOneoff, Effect, EffectQueue, PhaseTask, TaskQueue } from "./EffectQueue";
import { CancellableState } from "./State";
import { EffectCycle, Phase, POSTRENDER } from "./EffectCycle";



/**
 * @internal
 */


export type Action = {
   is: (...tags: string[]) => boolean;
   precedes: (competingUpdate: Update) => boolean;
   cancel: () => void;
}


// export class Mutation {

//    constructor(
//       public target: AnyObject,
//       public op: '[[set]]' | PropertyKey,
//       public input: [PropertyKey, unknown] | unknown[],
//    ) { }

//    apply() {
//       if (this.op === '[[set]]') {
//          const key = this.input[0] as PropertyKey
//          const value = this.input[1]
//          this.target[key] = value
//       }
//       else {
//          this.target[this.op](...this.input)
//       }
//    }
// }

class UpdateCancelled extends Error {
   constructor() {
      super('update cancelled')
   }
}

export const UpdateType = {
   USER_ANIMATION: 0,
   USER_INTERACTION: 1,
   BACKGROUND_ANIMATION: 2,
   SERVER_RESPONSE: 3,
   INSTANT: 4, // Catch-all for any unknown update type
   IDLE: 5, // Catch-all for any unknown update type
}

export type UpdateType = typeof UpdateType[keyof typeof UpdateType]

export class Update {
   timestamp: Date
   pendingCommit?: Promise<void>
   resolveCommit?: () => void

   constructor(
      public type: UpdateType,
      public timeMargin: number = 0,
      public rerun?: () => unknown,
      public idle: boolean | number = false
   ) {
      this.pendingCommit = idle ? new Promise<void>((resolve) => { this.resolveCommit = resolve }) : undefined
      this.cycle = new EffectCycle(this)
      this.timestamp = new Date() // TODO: make sure this is correct
   }


   private states: CancellableState[] = []

   commit() {
      for (const state of this.states) {
         state.commitPending()
      }
   }

   tags: Set<string> = new Set()

   asAction: Action = {
      is: (...tags: string[]) => {
         for (const tag of tags) {
            if (this.tags.has(tag))
               return true;
         }
         return false
      },

      precedes: (competingUpdate: Update) => {
         return this.timestamp < competingUpdate.timestamp  // TODO: make sure this is correct
      },

      cancel: () => {
         this.cancel()
      }
   }

   cancelled = false

   cancel() {
      this.cancelled = true;
      this.cycle.cancel()
      for (const state of this.states) {
         state.cancelPending()
      }
   }

   queueCommit(state: CancellableState) {
      this.states.push(state)
   }

   precedes(competingUpdate: Update) {
      return this.timestamp < competingUpdate.timestamp
   }

   race(competingUpdate: Update | null) { // TODO: use algorithim based on type of update to determine whether to queue, drop, override. Currently this overrides
      if (competingUpdate === null) {
         this.cycle.start()
         return;
      }
      if (competingUpdate === this) {
         return;
      }
      if (competingUpdate) {
         if (!this.handleRace) {
            competingUpdate.precedes(this) ? competingUpdate.cancel() : this.cancel()
         }
         else {
            this.handleRace(competingUpdate.asAction)
         }
         if (this.cancelled) throw new UpdateCancelled();
         if (!competingUpdate.cancelled) {
            // queue 
            this.cancel()
            competingUpdate.onComplete(() => {
               const rerun = this.rerun
               if (__DEV__ && !rerun) throw new Error('unable to queue update. must provide rerun fn')
               if (rerun) {
                  runUpdate(rerun, new Update(this.type, this.timeMargin, rerun, this.idle))
               }
            })

         }
         return;
      }
      return;
   }

   private handleRace: ((competingAction: Action) => void) | undefined

   onBegin(fn: () => void) {
      this.cycle.onStart(fn)
   }

   cycle: EffectCycle;

   onComplete(task: () => void) { // TODO:
      // const effect = createOneoff(commitUpdate, this.cycle.phases.length - 1)
      this.cycle.scheduleTask(new PhaseTask(task, POSTRENDER))
      // this.flask.onDiscard(() => (console.trace('discarding commit'), effect.destroy())) // TODO: Make sure we don't need this line
      // this.commits.push(effect)
   }

   // private commits: Effect[] = []

   // cancel() {
   //    this.commits.forEach(commit => commit.destroy())
   //    this.cycle.cancel()
   //    this.cancelTasks.forEach(task => task())
   //    this.cancelTasks = []
   // }

   // private cancelTasks: (() => void)[] = []

   // onCancel(task: () => void) {
   //    this.cancelTasks.push(task)
   // }


}


export const queueTask = setImmediate;








// TODO: change to stack type
const updateStack: Update[] = [];

export function pushUpdate(update: Update) {
   return updateStack.push(update)
}

export function popUpdate() {
   return updateStack.pop()
}

export function getActiveUpdate() {
   return updateStack.at(-1)
}

export function isIdleUpdate() {
   return !!(getActiveUpdate()?.idle)
}



export function $activeUpdate() {
   const update = getActiveUpdate()
   if (!update && __DEV__) throw new Error('Must be called within update context')
   return update;
}


export function useUpdate(timeMargin: number = 16, idle: boolean | number = false) {
   return getActiveUpdate() ?? new Update(UpdateType.INSTANT, timeMargin, undefined, idle);
}



export function idleUpdate(fn: () => void, options?: { timeMargin?: number, deadline?: number }): void {
   const timeMargin = options?.deadline ?? options?.timeMargin ?? 1000;
   runUpdate(fn, new Update(UpdateType.IDLE, timeMargin, fn, options?.deadline ?? true))
}


export function instantUpdate(fn: () => void): void {
   runUpdate(fn, new Update(UpdateType.INSTANT, 16, fn))
}

export function swiftUpdate<T>(fn: () => void) {
   runUpdate(fn, new Update(UpdateType.USER_INTERACTION, 50, fn, 17))
}

function runUpdate(fn: () => void, update: Update) {
   try {
      pushUpdate(update)
      fn()
   }
   catch (error) {
      catchCancelledUpdate(error)
   }
   finally {
      popUpdate()
      if (!update.cancelled) update.cycle.start()
   }
}

export function catchCancelledUpdate(error: unknown) {
   if (error instanceof UpdateCancelled) {
      if (__DEV__) console.warn('update cancelled', error)
   }
   else {
      throw error;
   }
}