import { AnyObject } from "@rue/types"
import { Mutable } from "../abstract/Mutable"
import { isLazyUpdate } from "./UpdateCycle"

export const NULL = Symbol('null')

/**
 * Interface for managing lazy state updates
 */
export interface ILazyState {
   active: unknown // state depending on update context (lazy or priority)
   current: unknown
   pending: unknown
   previous: unknown
   commitChange(): void
   cancelChange(): void
   // recordChange(newState: unknown, oldState: unknown): void
}


class LazyState<T> implements ILazyState {

   previous: unknown
   
   constructor(
      public current: T
   ) {
      this.previous = current;
   }
   
   get active() {
      return isLazyUpdate() && this.pending !== NULL ? this.pending : this.current
   }

   protected _pending: T | typeof NULL = NULL

   get pending() {
      if (this._pending !== NULL)
         return this._pending
      return this.current;
   }

   set pending(value: T | typeof NULL) {
      this._pending = value;
   }

   commitChange() { // TODO: record mutation here?
      if (this._pending === NULL) return;
      this.current = this._pending;
      this._pending = NULL;
   }

   cancelChange() {
      this._pending = NULL;
   }

   asMutable = new Mutable()

   // recordChange(newState: unknown, oldState: unknown) {
   //    // recordMutation(this.asMutable, new Mutation(
   //    //    this, // TODO: figure out what to pass here
   //    //    '[[set]]',
   //    //    ['value', newState], // TODO: should the key be 'current' ?
   //    //    newState,
   //    //    oldState
   //    // ))
   // }
}


export const IonState = LazyState


export class ModelState<T extends AnyObject = AnyObject> extends LazyState<T> {

   constructor(
      public current: T,
      public clone: ((current: AnyObject) => AnyObject)
   ) {
      super(current)
   }

   get pending() {
      return this._pending
   }
   set pending(value: T | typeof NULL) {
      this._pending = value;
   }

   cloneCurrent() {
      return this.clone(this.current)
   }
}


export class PionState implements ILazyState {

   constructor(
      private modelState: ModelState<AnyObject>,
      public key: PropertyKey,
   ) {
      this.previous = this.current
   }

   get active() {
      return isLazyUpdate() && this.pending !== NULL ? this.pending : this.current
   }

   previous: unknown

   get current() {
      return this.modelState.current[this.key]
   }

   set current(value: unknown) {
      this.modelState.current[this.key] = value
   }

   get pending() {
      if (this.modelState.pending !== NULL)
         return this.modelState.pending[this.key]
      return this.modelState.current[this.key]
   }

   set pending(value: unknown) {
      if (this.modelState.pending === NULL) {
         this.modelState.pending = this.modelState.cloneCurrent()
      }
      this.modelState.pending[this.key] = value;
   }

   commitChange() {
      this.modelState.commitChange()
      // if (this.modelState.pending === NULL) return;
      // this.modelState.current = this.modelState.pending;
      // this.modelState.pending = NULL;
   }

   cancelChange() {
      this.modelState.cancelChange()
      // this.modelState.pending = NULL;
   }

   // asMutable = new Mutable()

   // recordChange(newState: unknown, oldState: unknown) {
   //    // recordMutation(this.asMutable, new Mutation(
   //    //    this.entity, // TODO: figure out what to pass here
   //    //    '[[set]]',
   //    //    [this.key, newState],
   //    //    newState,
   //    //    oldState
   //    // ))
   // }
}