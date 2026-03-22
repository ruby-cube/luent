import { Ion } from "../quarky/src/ion/Ion";
import { instantUpdate, popUpdate, pushUpdate, Update } from "../quarky/src/reactivity/Update";
import { RenderCycle } from "../quarky/src/reactivity/x_RenderCycle";





export const $cancelCount = Ion(0)

type RaceHandled = boolean

export type UpdateType = typeof UpdateType[keyof typeof UpdateType]

export const UpdateType = {
   USER_ANIMATION: 0,
   USER_INTERACTION: 1,
   BACKGROUND_ANIMATION: 2,
   SERVER_RESPONSE: 3,
   INSTANT: 4, // Catch-all for any unknown update type
   IDLE: 5, // Catch-all for any unknown update type
}


export class LazyUpdate implements Update {
   timestamp: number = Date.now()

   private _cycle?: RenderCycle
   fn: () => unknown;
   private output: unknown;

   completed: Promise<unknown>;
   private resolve!: (value: unknown) => void;
   private reject!: (reason?: any) => void;

   get cycle() {
      return this._cycle ?? (this._cycle = new RenderCycle(this))
   }

   start() {
      const output = this.output
      if (output instanceof Promise) {
         output.then((o) => {
            this.cycle.start()
            this.cycle.onCompleted(() => {
               this.resolve(o)
            })
            return this.completed
         })
      }
      else {
         this.cycle.start() // TODO: return a promise resolved with output
         this.cycle.onCompleted(() => {
            this.resolve(output)
         })
         return this.completed
      }
   }

   constructor(
      fn: () => unknown,
      public type: UpdateType,
      public timeMargin: number = 0,
      public idle: boolean | number = false
   ) {
      this.fn = () => this.output = fn()
      this.completed = new Promise<unknown>((resolve, reject) => {
         this.resolve = resolve;
         this.reject = reject
      }).catch(catchCancelledUpdate)
   }

   committed = false

   commit() {
      this.committed = true
      this.emitter.dispatchEvent(this.commitupdate!)
      this.emitter.dispatchEvent(this.settled!)
   }

   cancelled = false

   cancel() {
      instantUpdate(() => { $cancelCount.value++ })
      console.warn('CANCELLING UPDATE')
      this.cancelled = true;
      this.reject('update cancelled')
      this.cycle.cancel()
      this.emitter.dispatchEvent(this.cancelupdate!)
      this.emitter.dispatchEvent(this.settled!)
   }

   private _emitter?: EventTarget;

   get emitter() {
      return this._emitter ?? (
         this.commitupdate = new Event(this.COMMIT),
         this.cancelupdate = new Event(this.CANCEL),
         this.settled = new Event(this.SETTLED),
         this._emitter = new EventTarget() // TODO: replace with arrays
      )
   }

   // NOTE: settled event must be dispatched AFTER commit and cancel

   private SETTLED = 'settled'

   private settled: Event | undefined

   atSettled(task: () => void) {
      this.emitter.addEventListener(this.SETTLED, task)
   }

   private COMMIT = 'commit'

   private commitupdate: Event | undefined

   atCommit(task: () => void) {
      this.emitter.addEventListener(this.COMMIT, task)
   }

   private CANCEL = 'cancel'

   private cancelupdate: Event | undefined

   atCancel(task: () => void) {
      this.emitter.addEventListener(this.CANCEL, task)
   }

   _completed = false; // FIX:

   complete() {
      this._completed = true;
      this.emitter.dispatchEvent(this.completeUpdate)
   }

   private COMPLETE = 'complete'

   private completeUpdate: Event = new Event(this.COMPLETE)

   atComplete(task: () => void) {
      this.emitter.addEventListener(this.COMPLETE, task)
   }


   // race conditions

   race(rival: Update | null) { // TODO: use algorithim based on type of update to determine whether to queue, drop, override. Currently this overrides
      if (rival === null || rival === this) {
         return;
      }
      if (rival) {
         // console.warn('RACE CONDITION!!!!')
         if (!this.handleRace) {
            this.raceByType(rival)
         }
         else {
            this.handleRace(rival.asAction)
         }
         if (this.cancelled) throw new UpdateCancelled()
      }
   }

   raceByType(rival: Update) {
      if (this.precedes(rival)) {
         Update.races[this.type]?.(this, rival) ??
            rival.queueAfter(this)
      }
      else {
         Update.races[rival.type]?.(rival, this) ??
            this.queueAfter(rival)
      }
   }

   static races = {
      [UpdateType.USER_INTERACTION](updateA: Update, updateB: Update): RaceHandled {
         switch (updateB.type) {
            case UpdateType.USER_ANIMATION:
            case UpdateType.BACKGROUND_ANIMATION:
               updateB.drop()
               return true;

            default:
               updateB.queueAfter(updateA)
               return true;
         }
      },
      [UpdateType.SERVER_RESPONSE](updateA: Update, updateB: Update) {
         switch (updateB.type) {
            case UpdateType.USER_INTERACTION:
            case UpdateType.USER_ANIMATION:
            case UpdateType.BACKGROUND_ANIMATION:
               if ( __DEV__) throw new Error('This race condition should be made impossible by disabling UI interactions or unsharing state')
               else updateB.queueAfter(updateA)
               return true;

            default:
               updateB.queueAfter(updateA)
               return true;
         }
      }
   }

   drop() {
      console.log('dropping', this.type)
      this.cancel()
   }

   queueAfter(rival: Update) {
      console.log('queuing', this.type, 'after', rival.type)
      this.cancel()
      rival.atSettled(() => {
         runUpdate(new Update(this.fn, this.type, this.timeMargin, this.idle))
      })
   }

   private override(rival: Update) {
      rival.cancel()
   }

   private precedes(rival: Update) {
      return this.timestamp < rival.timestamp
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

      precedes: (rival: Update) => {
         return this.timestamp < rival.timestamp  // TODO: make sure this is correct
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
      if ( __DEV__) console.warn('update cancelled', error)
   }
   else if (error === 'update cancelled') {
      if ( __DEV__) console.warn('update cancelled')
      // effectsComplete promise cancelled
   }
   else {
      console.error(error)
      throw error; // FIX: this is not being thrown for some reason in runUpdate
   }
}









// TODO: not sure if I need this. Delete maybe
// export function useUpdate(timeMargin: number = 16, idle: boolean | number = false) {
//    return getActiveUpdate() ?? new Update(UpdateType.INSTANT, timeMargin, undefined, idle);
// }




// export function dispatch<T>(fn: () => T, options?: { timeMargin?: number, deadline?: number }): Promise<T> {
//    const timeMargin = options?.deadline ?? options?.timeMargin ?? 1000;
//    return runUpdate(new LazyUpdate(fn, UpdateType.IDLE, timeMargin, options?.deadline ?? true)) as Promise<T>
// }






// TODO: what happens when swiftUpdates queue up too long??
// export function swiftUpdate<T>(fn: () => void) {
//    runUpdate(new Update(fn, UpdateType.USER_INTERACTION, 100, 17))
// }

function runUpdate(update: LazyUpdate) {
   try {
      pushUpdate(update)
      update.fn() // TODO: pass in await sequence?

   }
   catch (error) {
      catchCancelledUpdate(error) // FIX: errors are being swallowed up here despite being rethrown. May be because run update returns a promise
   }
   finally {
      popUpdate()
      if (!update.cancelled) {
         return update.start()
      }
   }
}

export function tryUpdate(fn: () => unknown) {
   try {
      fn() // TODO: pass in await sequence?

   }
   catch (error) {
      catchCancelledUpdate(error) // FIX: errors are being swallowed up here despite being rethrown. May be because run update returns a promise
   }
}




export function renderServerResponse(fn: () => void) {
   runUpdate(new Update(fn, UpdateType.SERVER_RESPONSE, 1000))
}




/**
 * @internal
 */


export type Action = {
   is: (...tags: string[]) => boolean;
   precedes: (rival: Update) => boolean;
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





