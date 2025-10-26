import { resolve } from "path"
import { getCurrentPhase, isLazyUpdate, Mutation, Update } from "./UpdateCycle"
import type { Action } from "./UpdateCycle"
import { Watchable, Watched } from "./Watched"
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

   active: unknown // state depending on update context (lazy or priority)
   current: unknown
   pending: unknown

   changed: boolean

   cancelPending(): void
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

   get active() {
      const phase = getCurrentPhase()
      return phase === INTERNAL_RENDER || phase === RENDER ? this.current : this.pending
      // return isLazyUpdate() ? this.pending : this.current
   }

   changed = false

   cancelPending() {
      if (this.changed) {
         this.pending = this.current
         this.changed = false;
      }
      this.pendingUpdate = null;
   }

   pendingUpdate: Update | null = null

   set(value: T, update: Update) {
      if (update.lazy) {
         this.pending = value
         update.recordMutation(new Mutation(this, '[[set]]', ['current', value]))
      }
      else {
         this.current = value
         this.pending = value
      }

      if (this.pendingUpdate === update) {
         return; // return because no need to trigger and lock
      }

      update.lock(this)

      this.changed = true
      
      return this.active
   }
}


class LazyCollectionState<T> implements ILazyState {

   previous: unknown
   pending: T

   constructor(
      public current: T,
      private clone: <T>(current: T) => T = <T>(value: T) => value
   ) {
      this.previous = clone(current);
      this.pending = clone(current);
   }

   get active() {
      return isLazyUpdate() ? this.pending : this.current
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
