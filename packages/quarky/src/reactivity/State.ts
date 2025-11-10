import { getActiveUpdate,  Update, useUpdate } from "./Update"
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
   cancelPending(): void
   commitPending(): void
}

// TODO: history
export interface PendableState extends CancellableState {
   current: unknown
   pending: unknown
   get(): unknown
   // lock(): Update | undefined
}

function getState(state: PendableState) {
   console.trace('getting state', state.current)
   if (state.pendingUpdate === getActiveUpdate()) return state.current;
   return state.pendingUpdate && state.pendingUpdate?.idle ? state.pending : state.current
}

function lockState(state: PendableState, type: 'read' | 'write') {
   const update = type === 'read' ? getActiveUpdate() : useUpdate(16)  // to warn if render blocking, give a 16ms timemargin
   if (!update) return;
   const pendingUpdate = state.pendingUpdate
   update.race(pendingUpdate) // TODO: race() should throw if cancelling this update
   state.pendingUpdate = update
   if (type == 'write') update.queueCommit(state)
   // return update
}



export class SimpleState implements PendableState {
   current: unknown
   pending: unknown

   constructor(current: unknown) {
      this.current = current;
      this.pending = current;
   }

   get() {
      this.lock('read')
      return getState(this)
   }

   private lock(type: 'read' | 'write' = 'write') {
      return lockState(this, type)
   }

   pendingUpdate: Update | null = null

   cancelPending(): void {
      this.pending = this.current
      this.pendingUpdate = null;
   }

   commitPending(): void {
      console.log('commit pending', this.pending)
      console.log('commit current', this.current)
      this.current = this.pending
      this.pendingUpdate = null;
   }

   set(value: unknown) {
      this.lock()
      this.pending = value
      return value
   }
}


export class ModelState implements PendableState {

   current: AnyObject
   pending: AnyObject

   constructor(
      current: AnyObject,
      private clone: <T>(current: AnyObject) => AnyObject = (model: AnyObject) => model
   ) {
      this.current = current;
      this.pending = clone(current);
   }

   get() {
      this.lock('read')
      return getState(this)
   }

   private lock(type: 'read' | 'write' = 'write') {
      return lockState(this, type)
   }

   pendingUpdate: Update | null = null

   private mutated = false

   cancelPending() {
      if (this.mutated) {
         this.pending = this.clone(this.current)
         this.mutated = false
      }
      this.pendingUpdate = null
   }

   commitPending(): void {
      if (this.mutated) {
         this.current = this.pending
         this.pending = this.clone(this.pending)
         this.mutated = false
      }
      this.pendingUpdate = null
   }

   mutate(fn: (model: AnyObject) => void) {
      this.lock()
      this.mutated = true;
      fn(this.pending)
   }
}





