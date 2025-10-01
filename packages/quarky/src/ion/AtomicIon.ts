import { emitSignal } from "../debug/debug";
import { InertMark, ionize, Ionized, isIonizedModel } from "../ionized/ionize";
import { AnyObject } from "@rue/types";
import { __DEV__getTrace, } from "../../../flask/debug";
import { __DEV__trace } from "../debug/debug";
import { hasQuark, Quark, QUARK, QuarkOf, quarkOf } from "../Quark";
import { trigger, Watchable, WatchedAtom } from "../reactivity/WatchedAtom";
import { Mutable } from "../Mutable";
import { Traceable } from "../debug/Traceable";
import { isObject } from "@rue/utils";
import { Ion, MutableIon } from "./Ion";
import { ModelQuark } from "../ionized/ModelQuark";
import { trackParticle } from "../compound/Compound";
import { Update, isLazyUpdate, initUpdate } from "../reactivity/UpdateCycle";
import { inert, isInert } from "../ionized/inert";
import { maybeIonize, MarkMap } from "../ionized/IonizedModel";

export const NULL = Symbol('null')
/** INTERNAL */
export type $AtomicIonState =
   MutableIon<unknown>
   // & MutableCapsule
   // & MutableEntity
   & {
      [QUARK]: AtomicIonQuark
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



export const IONIZED = true
export const ALL_METHODS = 'all_methods'

interface IState {
   current: unknown
   pending: unknown
   active: unknown
   previous: unknown
   commitChange(): void
   cancelChange(): void
   // recordChange(newState: unknown, oldState: unknown): void
}

export class State<T> implements IState {

   constructor(
      public current: T
   ) {
      this.previous = current;
   }

   get active() {
      return isLazyUpdate() && this.pending !== NULL ? this.pending : this.current
   }

   previous: unknown
   // get previous() {
   //    return this.active
   // }

   // set previous(value: unknown){

   // }

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
   //    //    ['value', newState], //TODO: should the key be 'current' ?
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
   //    //    this.entity, //TODO: figure out what to pass here
   //    //    '[[set]]',
   //    //    [this.key, newState],
   //    //    newState,
   //    //    oldState
   //    // ))
   // }
}


export class AtomicQuark implements Watchable, Quark {
   pendingUpdate: null | Update = null
   quarkType = ATOMIC
   trigger = trigger
   asWatchedAtom: undefined | WatchedAtom
}

/**
 * Quark for atomic ion, pion, and atomic get op
*/


export class AtomicIonQuark extends AtomicQuark {
   track = () => trackParticle(this)

   constructor(
      public state: IState,
      public modelQuark?: ModelQuark,
      public customTrack?: () => void,
      public customTrigger?: () => void
   ) {
      super()
      this.__DEV__asTraceable = modelQuark?.__DEV__asTraceable ?? new Traceable()
      if (customTrigger || modelQuark) this.trigger = (update: Update) => {
         trigger.apply(this, [update])
         modelQuark?.trigger(update)
         customTrigger?.()
      }
      if (customTrack) this.track = () => {
         trackParticle(this)
         customTrack.apply(this)
      }
   }
   __DEV__asTraceable: Traceable;

   transformGet?: (value: unknown) => unknown
   transformSet?: (value: unknown, fail: typeof FAIL) => unknown | typeof FAIL
}

// const debugg = {
//    on($state: Ion, key: string, task: () => void) {
//       if (key === 'get') {
//          quarkOf($state as $AtomicIonState).getterTasks.push()
//       }
//    }
// }

/** INTERNAL */
export function createAtomicIon(
   quark: AtomicIonQuark,
   ionized: boolean,
   mark?: InertMark | MarkMap | undefined,
   props?: AnyObject
) {
   const $state = getState.bind(quark) as $AtomicIonState
   $state[QUARK] = quark
   //@ts-expect-error
   $state.displayName = 'getState'

   if (props) {
      const descriptors = Object.getOwnPropertyDescriptors(props)
      const onGet = descriptors.value?.get
      const onSet = descriptors.value?.set as (value: unknown) => boolean
      if (onGet) {
         quark.transformGet = ionized ? (value: unknown) => {
            return onGet.apply({ value: maybeIonize(value, mark) })
         } : (value) => onGet.apply({ value })
      }
      if (onSet) {
         quark.transformSet = (value: unknown, fail: typeof FAIL) => {
            const state = { value: $state() }
            const success = onSet.apply(state, [value])
            if (success === false) return fail;
            return state.value;
         }
      }
      delete descriptors.value
      Object.defineProperties($state, descriptors)
   }
   else if (ionized) {
      quark.transformGet = (value: unknown) => {
         return maybeIonize(value, mark)
      }
   }

   Object.defineProperty($state, 'value', {
      get: $state,
      set: setState.bind(quark)
   })

   return $state
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
   this.track()
   const state = isLazyUpdate() ? this.state.pending : this.state.current
   return this.transformGet ? this.transformGet(state) : state;
}

const FAIL = Symbol('fail')

export function setState(this: AtomicIonQuark, value: unknown) {
   const newState = this.transformSet ? this.transformSet(value, FAIL) : value;
   if (newState === FAIL) return;

   // const oldState = state.previous;
   // if (newState === oldState) { //NOTE: we cannot do this if we are cloning arrays--the new array needs to be updated with all changes
   //    return newState;
   // }

   const state = this.state

   const update = initUpdate()

   // set state
   if (update.lazy) {
      state.pending = newState
   }
   else {
      state.current = newState;
   }

   const pendingUpdate = this.pendingUpdate
   if (pendingUpdate === update) return state;

   if (pendingUpdate && pendingUpdate !== update) {
      pendingUpdate.cancel()
   }

   this.pendingUpdate = update

   update.onComplete(() => {
      state.commitChange()
      this.pendingUpdate = null;
   })

   update.onCancel(() => {
      state.cancelChange()
      this.pendingUpdate = null;
   })

   // queue change/record mutation
   // update.onComplete(() => {
   // })

   // update.onCancel(() => {
   // })

   // trigger effects
   this.trigger(update)
   this.modelQuark?.trigger(update);

   return state;
}