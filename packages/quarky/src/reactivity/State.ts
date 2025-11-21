import { $activeUpdate, getActiveUpdate, Update } from "./Update"
import type { Action } from "./Update"
import { AnyObject } from "@rue/types"

interface ActionStack<T> {
   action: T;
   prev: ActionStack<T> | undefined;
}

let actionStack = undefined

type ActionOptions = {
   '@race'?: (competingAction: Action) => void
   // catch(err) { },
   tags?: string[],
   lazy?: { limit: number } | true,
   await?: true
}

function Action<F>(fn: F, options?: ActionOptions) {

   // TODO: add pending state to function

   return fn
}


/**
 * Interface for managing lazy state updates
 */

export interface CancellableState {
   pendingUpdate: Update | null
   cancelUpdate(): void
   commitUpdate(): void
}

// TODO: history
export interface PendableState extends CancellableState {
   current: unknown
   pending: unknown
   get(): unknown
   // lock(): Update | undefined
}

function getState(state: PendableState) {
   if (state.pendingUpdate && state.pendingUpdate === getActiveUpdate()) {
      return state.pending;
   }
   return state.current
}

function lockState(state: PendableState) {
   const update = $activeUpdate()
   if (!update) {
      console.warn('nothing to lock to')
      return;
   }
   if (update.cancelled) console.warn('DEV RESEARCH: state is being accessed after update cancelled...')
   if (update.committed) return;
   update.race(state.pendingUpdate)
   if (state.pendingUpdate === null) {
      state.pendingUpdate = update
      update.atSettled(() => {
         state.pendingUpdate = null
      })
   }
   queueCommit(update, state)
}


export function queueCommit(update: Update, state: PendableState) {
   update.atCommit(() => {
      state.commitUpdate()
   })
   update.atCancel(() => {
      state.cancelUpdate()
   })
}



export class SimpleState implements PendableState {
   current: unknown
   pending: unknown

   constructor(
      current: unknown,
   ) {
      this.current = current;
      this.pending = current;
   }

   get() {
      return getState(this)
   }

   protected lock() {
      return lockState(this)
   }

   pendingUpdate: Update | null = null

   cancelUpdate(): void {
      this.pending = this.current
   }

   commitUpdate() {
      return this.current = this.pending
   }

   set(value: unknown) {
      this.lock()
      this.pending = value
      return value
   }
}

// export class PionState extends SimpleState {
//    constructor(
//       current: unknown,
//       private onCommit: (value: unknown) => void
//    ) {
//       super(current)
//    }
//    override commitUpdate() {
//       // this.onCommit(
//          this.current = this.pending
//       // )
//    }
// }

// TODO:
// for ionic model
// value => target[key] = value

// for ionic collective 
// value => state.current[key] = state.pending[key] = value


export class CollectiveState implements PendableState {

   current: AnyObject
   pending: AnyObject

   constructor(
      current: AnyObject,
      protected clone: <T>(current: AnyObject) => AnyObject = (model: AnyObject) => model
   ) {
      this.current = current;
      this.pending = clone(current);
   }

   get() {
      return getState(this) as AnyObject
   }

   protected lock() {
      return lockState(this)
   }

   pendingUpdate: Update | null = null

   private mutated = false

   cancelUpdate() {
      if (this.mutated) {
         this.pending = this.clone(this.current)
         this.mutated = false
      }
   }

   commitUpdate(): void {
      if (this.mutated) {
         this.current = this.pending
         this.pending = this.clone(this.pending)
         this.mutated = false
      }
   }


   mutate(fn: (model: AnyObject) => unknown) {
      this.lock()
      this.mutated = true;
      return fn(this.pending)
   }

   mutateSync(fn: (model: AnyObject) => unknown) {
      this.mutated = true;
      return fn(this.pending)
   }

}




export class PrivateState extends CollectiveState {

   constructor(
      current: AnyObject,
      clone: <T>(current: AnyObject) => AnyObject = (model: AnyObject) => model
   ) {
      super(current, clone)
   }

   override commitUpdate(): void {
      if (this.mutations.length)
         this.applyMutations()
   }

   private mutations: ((model: AnyObject) => unknown)[] = []

   override mutate(fn: (model: AnyObject) => unknown) {
      this.lock()
      this.mutations.push(fn)
      return fn(this.pending)
   }

   override mutateSync(fn: (model: AnyObject) => unknown) {
      this.mutations.push(fn)
      return fn(this.pending)
   }

   private applyMutations() {
      for (const mutate of this.mutations) {
         mutate(this.current)
      }
      this.mutations = []
   }


}





