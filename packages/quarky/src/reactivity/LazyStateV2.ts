import { resolve } from "path"
import { getActiveUpdate, getCurrentPhase, isIdleUpdate, Mutation, Update, useUpdate } from "./UpdateCycle"
import type { Action } from "./UpdateCycle"
import { Atom, TrackedAtom } from "./Atom"
import { AnyObject } from "@rue/types"
import { INTERNAL_RENDER, RENDER } from "./render-cycle"

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
export interface ILazyState {

   // TODO: history
   previous: unknown

   // active: unknown // state depending on update context (lazy or priority)
   // get(): unknown
   current: unknown
   pending: unknown

   // changed: boolean

   // cancelPending(): void
   cancelPending(): void
   commitPending(): void

   pendingUpdate: Update | null
}




export class LazyState<T> implements ILazyState {

   previous: unknown
   pending: T

   constructor(
      public current: T,
   ) {
      this.previous = current;
      this.pending = current;
   }

   pendingUpdate: Update | null = null

   get() {
      if (this.pendingUpdate === getActiveUpdate()) return this.current;
      return this.pendingUpdate && this.pendingUpdate?.idle ? this.pending : this.current
   }

   set(value: T, update: Update) {
      update.onBegin(() => { // in case update has been queued
         if (update.idle) {
            this.pending = value
         }
         else {
            this.current = value
            this.pending = value
         }
      })
      return value
   }

   lock(type: 'read' | 'write' = 'write') {
      const update = type === 'read' ? getActiveUpdate() : useUpdate(16)  // to warn if render blocking, give a 16ms timemargin
      if (!update) return;
      const pendingUpdate = this.pendingUpdate
      const success = update.race(pendingUpdate)
      if (success) {
         this.pendingUpdate = update
         if (type == 'write') update.queueCommit(this)
         return update
      }
      return;
   }

   cancelPending() {
      this.pending = this.current
      this.pendingUpdate = null;
   }

   commitPending(): void {
      this.current = this.pending
      this.pendingUpdate = null;
   }

}


export class ModelState<T> implements ILazyState {

   previous: unknown
   pending: T

   constructor(
      public current: T,
      private clone: <T>(current: T) => T = <T>(value: T) => value
   ) {
      this.previous = clone(current);
      this.pending = clone(current);
   }

   get() {
      if (this.pendingUpdate === getActiveUpdate()) return this.current;
      return this.pendingUpdate && this.pendingUpdate?.idle ? this.pending : this.current
   }

   changed = false;

   cancelPending() {
      if (this.changed) {
         this.pending = this.clone(this.current)
         this.changed = false
      }
      this.pendingUpdate = null
   }

   pendingUpdate: Update | null = null
}



// TODO: LazyPionState


// TODO: LazyOpsState


