import { $activeUpdate, getActiveUpdate, Update, useUpdate } from "./Update"
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
   if (state.pendingUpdate === getActiveUpdate()) {
      console.log('pending update matches active update')
      return state.pending;
   }
   console.warn('get from outside of active update...')
   // return state.pendingUpdate && state.pendingUpdate?.idle ? state.pending : 
   return state.current
}

function lockState(state: PendableState, type: 'read' | 'write') {
   const update = type === 'read' ? getActiveUpdate() : $activeUpdate()
   if (!update) {
      console.log('nothing to lock to')
      return;
   }
   if (update.cancelled) console.warn('DEV RESEARCH: state is being accessed after update cancelled...')
   if (update.committed) return;
   update.race(state.pendingUpdate) // TODO: race() should throw if cancelling this update
   if (state.pendingUpdate === null) {
      console.warn('SETTING PENDING UPDATE')
      state.pendingUpdate = update
      update.atSettled(() => {
         console.warn('SETTLED: nulling update')
         state.pendingUpdate = null
      })
   }
   if (type == 'write') update.queueCommit(state)
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

   cancelUpdate(): void {
      console.log('cancel update', this)
      this.pending = this.current
   }

   commitUpdate(): void {
      console.log('commit update', this)
      this.current = this.pending
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

   mutate(fn: (model: AnyObject) => void) {
      this.lock()
      this.mutated = true;
      fn(this.pending)
   }
}





