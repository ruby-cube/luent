import { CancellableState } from "./State";
import { RenderCycle, Phase, POSTLUDE } from "./RenderCycle";
import { createStack } from "@rue/utils";



export const [pushUpdate, popUpdate, getActiveUpdate] = createStack<Update>()

export function $activeUpdate() {
   const update = getActiveUpdate()
   if (!update && __DEV__) throw new Error('Must be called within update context')
   return update;
}



export class Update {
   timestamp: Date = new Date() // TODO: make sure this is correct

   private _cycle?: RenderCycle

   get cycle() {
      return this._cycle ?? (this._cycle = new RenderCycle(this))
   }

   constructor(
      public fn: () => unknown,
      public type: UpdateType,
      public timeMargin: number = 0,
      public idle: boolean | number = false
   ) {
      console.trace('new update!', type)
   }

   private states: CancellableState[] = []

   queueCommit(state: CancellableState) {
      this.states.push(state)
   }

   committed = false

   commit() {
      for (const state of this.states) {
         state.commitUpdate()
      }
      this.committed = true
      this.emitter.dispatchEvent(this.settled!)
   }

   cancelled = false

   cancel() {
      console.warn('CANCELLING UPDATE')
      this.cancelled = true;
      this.cycle.cancel()
      for (const state of this.states) {
         state.cancelUpdate()
      }
      this.emitter.dispatchEvent(this.settled!)
   }

   private _emitter?: EventTarget;

   get emitter() {
      return this._emitter ?? (this.settled = new Event(this.SETTLED), this._emitter = new EventTarget())
   }

   // 'settled' hook

   private SETTLED = 'settled'

   private settled: Event | undefined

   atSettled(task: () => void) {
      this.emitter.addEventListener(this.SETTLED, task)
   }


   // race conditions

   race(competingUpdate: Update | null) { // TODO: use algorithim based on type of update to determine whether to queue, drop, override. Currently this overrides
      if (competingUpdate === null || competingUpdate === this) {
         return;
      }
      if (competingUpdate) {
         console.warn('RACE CONDITION!!!!')
         if (!this.handleRace) {
            this.raceByType(competingUpdate)
            competingUpdate.precedes(this) ? competingUpdate.cancel() : this.cancel()
         }
         else {
            this.handleRace(competingUpdate.asAction)
         }

         if (this.cancelled) throw new UpdateCancelled();
         if (!competingUpdate.cancelled) {
            // queue 
            this.cancel()
            competingUpdate.atSettled(() => {
               new Update(this.fn, this.type, this.timeMargin, this.idle)
                  .run()
            })

         }
         return;
      }
      return;
   }

   raceByType(competingAction) {

   }

   precedes(competingUpdate: Update) {
      return this.timestamp < competingUpdate.timestamp
   }

   private handleRace: ((competingAction: Action) => void) | undefined


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
}


class UpdateCancelled extends Error {
   constructor() {
      super('update cancelled')
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









// TODO: not sure if I need this. Delete maybe
// export function useUpdate(timeMargin: number = 16, idle: boolean | number = false) {
//    return getActiveUpdate() ?? new Update(UpdateType.INSTANT, timeMargin, undefined, idle);
// }

export type UpdateType = typeof UpdateType[keyof typeof UpdateType]

export const UpdateType = {
   USER_ANIMATION: 0,
   USER_INTERACTION: 1,
   BACKGROUND_ANIMATION: 2,
   SERVER_RESPONSE: 3,
   INSTANT: 4, // Catch-all for any unknown update type
   IDLE: 5, // Catch-all for any unknown update type
}


export function idleUpdate(fn: () => void, options?: { timeMargin?: number, deadline?: number }): void {
   const timeMargin = options?.deadline ?? options?.timeMargin ?? 1000;
   runUpdate(new Update(fn, UpdateType.IDLE, timeMargin, options?.deadline ?? true))
}


export function instantUpdate(fn: () => void): void {
   runUpdate(new Update(fn, UpdateType.INSTANT, 16.7))
}

export function swiftUpdate<T>(fn: () => void) {
   runUpdate(new Update(fn, UpdateType.USER_INTERACTION, 100, 17))
}

export function runUpdate(update: Update) {
   try {
      pushUpdate(update)
      update.fn()
   }
   catch (error) {
      catchCancelledUpdate(error)
   }
   finally {
      popUpdate()
      if (!update.cancelled) {
         update.cycle.start()
      }
   }
}

/**
 * tickUpdates will be initialized as a new task after 
 * @param fn 
 * @param origin 
 */
export function tickUpdate(fn: () => void, origin: Update): void {
   const update = new Update(fn,
      origin.type,
      origin.timeMargin,
      origin.type === UpdateType.USER_INTERACTION ? false : origin.idle
   )
   try {
      pushUpdate(update)
      fn()
   }
   catch (error) {
      catchCancelledUpdate(error)
   }
   finally {
      // NOTE: I'm worried about the chaos not running popUpdate synchronously will cause, but it's the only way to wrap an await's 'then' :(
      queueMicrotask(() => {
         popUpdate()
      })
      if (!update.cancelled) {
         update.cycle.start()
      }
   }
}




export function renderServerResponse(fn: () => void) {
   runUpdate(fn, new Update(UpdateType.SERVER_RESPONSE, 1000, fn))
}




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
