import { emitSignal } from "../debug/debug";
import { ionize } from "../ionized/ionize";
import { AnyObject } from "@rue/types";
import { __DEV__getTrace, } from "../../../flask/debug";
import { __DEV__trace } from "../debug/debug";
import { hasQuark, Quark, QUARK, QuarkOf, quarkOf } from "../Quark";
import { MutableCapsule } from "../capsule/Capsule";
import { trigger, Watchable, WatchedAtom } from "../watch/WatchedAtom";
import { Mutable, MutableEntity, MutableMorph, Mutation, recordMutation } from "../Mutable";
import { Traceable } from "../debug/Traceable";
import { debug, isObject } from "@rue/utils";
import { Ion, Methods, MutableIon } from "./Ion";
import { $activeUpdate, getActiveUpdate, isLazyUpdate, Update, initUpdate } from "../effect-cycle/ReactivitySystem";
import { IonizedModelQuark } from "../ionized/IonizedModelQuark";
import { trackParticle } from "../compound/Compound";

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
      //    asTraceable: Traceable,
      //    modelQuark: IonizedModelQuark | undefined
      //    // asPion: undefined | {
      //    //    models: undefined | IonizedModelQuark[]
      //    //    addModel(quark: IonizedModelQuark): void
      //    //    setPionState(quark: IonizedModelQuark, value: any): void
      //    // }
      // }
      // & Quark<typeof ATOMIC_ION, $AtomicIonState>
      // & Watchable
   }


/** 
 * INTERNAL 
 * For reactive ions only.
 * */
export type AtomicIonQuark = QuarkOf<$AtomicIonState>

export function maybeIonize(newValue: unknown, ionized: boolean) {
   return isObject(newValue) && ionized ? ionize(newValue) : newValue;
}

export const IONIZED = true
export const ALL_METHODS = 'all_methods'

interface State {
   current: unknown
   pending: unknown
   commitChange(): void
   cancelChange(): void
   recordChange(newState: unknown, oldState: unknown): void
   canPend: boolean
}

export class IonState implements State {
   canPend: boolean = true

   constructor(
      public current: unknown
   ) {

   }

   private _pending: unknown | typeof NULL = NULL

   get pending() {
      if (this._pending !== NULL)
         return this._pending
      return this.current;
   }

   set pending(value: unknown) {
      this._pending = value;
   }

   commitChange() {
      if (this._pending === NULL) return;
      this.current = this._pending;
      this._pending = NULL;
   }

   cancelChange() {
      this._pending = NULL;
   }

   asMutable = new Mutable()

   recordChange(newState: unknown, oldState: unknown) {
      // recordMutation(this.asMutable, new Mutation(
      //    this, //TODO: figure out what to pass here
      //    '[[set]]',
      //    ['state', newState], //TODO: should the key be 'current' ?
      //    newState,
      //    oldState
      // ))
   }
}

export type ModelState = {
   pending: AnyObject | typeof NULL
   current: AnyObject
   getActiveTarget: () => AnyObject
}

export class PionState implements State {
   canPend: boolean;

   constructor(
      private modelState: ModelState,
      public key: PropertyKey,
      private clone: ((current: AnyObject) => AnyObject) | undefined
   ) {
      this.canPend = !!clone
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
         this.modelState.pending = this.clone!(this.modelState.current)
      }
      this.modelState.pending[this.key] = value;
   }

   commitChange() {
      if (this.modelState.pending === NULL) return;
      this.modelState.current = this.modelState.pending;
      this.modelState.pending = NULL;
   }

   cancelChange() {
      this.modelState.pending = NULL;
   }

   asMutable = new Mutable()

   recordChange(newState: unknown, oldState: unknown) {
      // recordMutation(this.asMutable, new Mutation(
      //    this.entity, //TODO: figure out what to pass here
      //    '[[set]]',
      //    [this.key, newState],
      //    newState,
      //    oldState
      // ))
   }
}

export class AtomicQuark implements Watchable, Quark {

   constructor(
      public state: State,
      public ionized: boolean,
      public modelQuark?: IonizedModelQuark
   ) {
   }
   pendingUpdate: null | Update = null
   entity: $AtomicIonState | undefined
   quarkType = ATOMIC_ION
   asTraceable = new Traceable()
   trigger = trigger
   asWatchedAtom: undefined | WatchedAtom
}

/** INTERNAL */
export function createAtomicIon(
   quark: AtomicQuark,
   props?: AnyObject
) {

   // function $state() {
   //    if (__DEV__) emitSignal();
   //    trackParticle(quark)
   //    if (isLazyUpdate()) {
   //       return maybeIonize(quark.state.pending, quark.ionized); //TODO: inertSchema
   //    }
   //    return maybeIonize(quark.state.current, quark.ionized);
   // }
   const $state = getState.bind(quark) as $AtomicIonState
   $state[QUARK] = quark
   quark.entity = $state as $AtomicIonState

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

const ATOMIC_ION = Symbol('atomic ion')

/**
 * INTERNAL
 */
export function isAtomicIon(value: unknown): value is $AtomicIonState {
   return hasQuark(value) && quarkOf(<$AtomicIonState>value).quarkType === ATOMIC_ION
}

export function isAtomicIonQuark(value: unknown): value is AtomicIonQuark {
   return value instanceof Object && 'quarkType' in value && value.quarkType === ATOMIC_ION
}

function getState(this: AtomicQuark) {
   if (__DEV__) emitSignal();
   trackParticle(this)
   if (isLazyUpdate()) {
      return maybeIonize(this.state.pending, this.ionized); //TODO: inertSchema
   }
   return maybeIonize(this.state.current, this.ionized);
}

export function setState(this: AtomicQuark, value: unknown) {
   console.log('setState', value)
   const state = this.state

   const oldState = isLazyUpdate() ? state.pending : state.current;

   if (value === oldState) {
      return value;
   }
   const newState = maybeIonize(value, this.ionized)

   const update = initUpdate()
   const modelQuark = this.modelQuark
   const pendingUpdate = this.pendingUpdate ?? modelQuark?.pendingUpdate

   if (update.lazy && state.canPend) {
      state.pending = newState

      update.queue(() => {
         state.commitChange()
         state.recordChange(newState, oldState)
         this.pendingUpdate = null;
      })

      if (pendingUpdate && pendingUpdate !== update) {
         pendingUpdate.cancel()
         state.cancelChange()
      }
   }
   else {
      if (update.lazy && !state.canPend) update.lazy = false
      console.log('$$$ set state', value)

      if (pendingUpdate && pendingUpdate !== update) {
         pendingUpdate.cancel()
         state.cancelChange()
         // this.pendingUpdate = null;
      }

      state.current = newState;

      state.recordChange(newState, oldState)

      update.queue(() => {
         this.pendingUpdate = null;
      })
   }

   this.pendingUpdate = update

   this.trigger()

   if (modelQuark && modelQuark.pendingUpdate !== update) {
      console.log('$$$ modelQuark!', this.modelQuark)
      modelQuark.pendingUpdate = update;
      update.queue(() => {
         modelQuark.pendingUpdate = null;
      })
      modelQuark.trigger();
   }

   // if (quark.asPion?.models) {
   //    const models = quark.asPion.models;
   //    for (const quark of models) {
   //       quark.pendingUpdate = update;
   //       update.queue(() => {
   //          quark.pendingUpdate = null;
   //       })
   //       quark.trigger();
   //    }
   // }

   return state;
}