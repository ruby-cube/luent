import { emitSignal } from "../debug/debug";
import { ionize, Ionized, isIonizedModel } from "../ionized/ionize";
import { AnyObject } from "@rue/types";
import { __DEV__getTrace, } from "../../../flask/debug";
import { __DEV__trace } from "../debug/debug";
import { hasQuark, Quark, QUARK, QuarkOf, quarkOf } from "../Quark";
import { trigger, Watchable, WatchedAtom } from "../reactivity/WatchedAtom";
import { Mutable } from "../Mutable";
import { Traceable } from "../debug/Traceable";
import {  isObject } from "@rue/utils";
import { Ion, MutableIon } from "./Ion";
import { ModelQuark } from "../ionized/ModelQuark";
import { trackParticle } from "../compound/Compound";
import { Update , isLazyUpdate, initUpdate} from "../reactivity/UpdateCycle";

export const NULL = Symbol('null')
/** INTERNAL */
export type $AtomicIonState =
   MutableIon<unknown>
   // & MutableCapsule
   // & MutableEntity
   & {
      [QUARK]: AtomicQuark
      // {
      //    props: AnyObject | undefined;
      //    state: State,
      //    // state: any,
      //    // pState: any | typeof NULL,
      //    ionized: boolean,
      //    __DEV__asTraceable: Traceable,
      //    modelQuark: ModelQuark | undefined
      //    // asPion: undefined | {
      //    //    models: undefined | ModelQuark[]
      //    //    addModel(quark: ModelQuark): void
      //    //    setPionState(quark: ModelQuark, value: any): void
      //    // }
      // }
      // & Quark<typeof ATOMIC_ION, $AtomicIonState>
      // & Watchable
   }


/** 
 * INTERNAL 
 * For reactive ions only.
 * */
// export type AtomicIonQuark = QuarkOf<$AtomicIonState>

export function maybeIonize<T>(value: T, ionized: boolean): T extends AnyObject ? Ionized<T> : T {
   if (isIonizedModel(value)) return value as T extends AnyObject ? Ionized<T> : T;
   return (isObject(value) && ionized ? ionize(value) : value) as T extends AnyObject ? Ionized<T> : T
}

export const IONIZED = true
export const ALL_METHODS = 'all_methods'

interface IState {
   current: unknown
   pending: unknown
   active: unknown
   commitChange(): void
   cancelChange(): void
   // recordChange(newState: unknown, oldState: unknown): void
}

export class State<T> implements IState {

   constructor(
      public current: T
   ) {

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

   commitChange() { //TODO: record mutation here?
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
   //    //    this, //TODO: figure out what to pass here
   //    //    '[[set]]',
   //    //    ['state', newState], //TODO: should the key be 'current' ?
   //    //    newState,
   //    //    oldState
   //    // ))
   // }
}

export class IonState<T> extends State<T> {
   constructor(
      current: T
   ) {
      super(current)
   }
}


export class ModelState<T extends AnyObject = AnyObject> extends State<T> {

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

export class PionState implements IState {

   constructor(
      private modelState: ModelState<AnyObject>,
      public key: PropertyKey,
   ) {
   }

   get active() {
      return isLazyUpdate() && this.pending !== NULL ? this.pending : this.current
   }

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
   //    //    this.entity, //TODO: figure out what to pass here
   //    //    '[[set]]',
   //    //    [this.key, newState],
   //    //    newState,
   //    //    oldState
   //    // ))
   // }
}

/**
 * Quark for atomic ion, pion, and atomic get op
*/
export class AtomicQuark implements Watchable, Quark {
   pendingUpdate: null | Update = null
   quarkType = ATOMIC
   trigger = trigger
   asWatchedAtom: undefined | WatchedAtom
}

// export class AtomicPionQuark extends AtomicQuark {

//    constructor(
//       public state: State,
//       public ionized: boolean,
//       public modelQuark: ModelQuark,
//    ) {
//       super()
//       this.__DEV__asTraceable = modelQuark.__DEV__asTraceable;
//    }

//    __DEV__asTraceable: Traceable;
// }

export class AtomicIonQuark extends AtomicQuark {
   constructor(
      public state: IState,
      public ionized: boolean,
      public modelQuark?: ModelQuark,
      public getterTask?: () => void,
      public setterTask?: () => void
   ) {
      super()
      this.__DEV__asTraceable = modelQuark?.__DEV__asTraceable ?? new Traceable()
   }
   __DEV__asTraceable: Traceable;
}

/** INTERNAL */
export function createAtomicIon(
   quark: AtomicIonQuark,
   props?: AnyObject
) {
   const $state = getState.bind(quark) as $AtomicIonState
   $state[QUARK] = quark

   if (props) {
      if ('state' in props) {
         //TODO: need to incorporate setters
         // Object.defineProperty(props, 'state', {
         //    get: $state,
         //    set: (value: unknown) => {
         //       setState.apply(quark, [value])
         //    }
         // })
         // Object.defineProperties($state, Object.getOwnPropertyDescriptors(props))
      }
      else {
         Object.defineProperty($state, 'state', {
            get: $state,
            set: setState.bind(quark)
         })
         Object.defineProperties($state, Object.getOwnPropertyDescriptors(props))
      }
   }
   else {
      Object.defineProperty($state, 'state', {
         get: $state,
         set: setState.bind(quark)
      })
   }

   return $state
}

function attachCapsuleMethods(ion: Ion & AnyObject, props: AnyObject) {
   Object.defineProperties(ion, Object.getOwnPropertyDescriptors(props))
   // if (selectedMethods)
   //    for (const key in methods) {
   //       if (selectedMethods.has(key)){
   //          if (parentMethods && !parentMethods.has(key)) {
   //             ion[key] = useBlockedMethod(key)
   //             selectedMethods.delete(key)
   //          }
   //          else {
   //             ion[key] = methods[key].bind(thisIon)
   //          }
   //       }
   //       else ion[key] = useBlockedMethod(key)
   //    }
   // else
   // for (const key in methods) {
   //    ion[key] = methods[key].bind(thisIon)
   // }
}

const ATOMIC = Symbol('atomic')

/**
 * INTERNAL
 */
export function isAtomic(value: unknown): value is $AtomicIonState {
   return hasQuark(value) && quarkOf(<$AtomicIonState>value).quarkType === ATOMIC
}

export function isAtomicQuark(value: unknown): value is AtomicIonQuark {
   return value instanceof Object && 'quarkType' in value && value.quarkType === ATOMIC
}

function getState(this: AtomicIonQuark) {
   if (__DEV__) emitSignal();
   // if (this.state.key)console.log('track', this.state.key)
   trackParticle(this)
   this.getterTask?.()
   // if (this.state.key === 'length' && this.modelQuark) trackParticle(this.modelQuark)
   if (isLazyUpdate()) {
      return maybeIonize(this.state.pending, this.ionized); //TODO: inertSchema
   }
   return maybeIonize(this.state.current, this.ionized);
}

export function setState(this: AtomicIonQuark, value: unknown) {
   const state = this.state

   const oldState = state.active;
   const newState = maybeIonize(value, this.ionized)

   if (newState === oldState) {
      return newState;
   }

   const update = initUpdate()

   // queue change/record mutation
   update.onComplete(() => {
      state.commitChange()
   })

   update.onCancel(() => {
      state.cancelChange()
   })

   // set state
   if (update.lazy) {
      state.pending = newState
   }
   else {
      state.current = newState;
   }

   // trigger effects
   this.trigger(update)
   this.modelQuark?.trigger(update);
   // if (this.modelQuark) 
   // console.trace('trigger modelQuark of pion?', this.state.key)

   return state;
}