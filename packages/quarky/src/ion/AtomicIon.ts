import { emitSignal } from "../debug/debug";
import { ionize } from "../ionized/ionize";
import { AnyObject } from "@rue/types";
import { __DEV__getTrace, } from "../../../flask/debug";
import { __DEV__trace } from "../debug/debug";
import { hasQuark, Quark, QUARK, QuarkOf, quarkOf } from "../Quark";
import { MutableCapsule } from "../capsule/Capsule";
import { trigger, Watchable } from "../watch/WatchedAtom";
import { Mutable, MutableEntity, MutableMorph, Mutation, recordMutation } from "../Mutable";
import { Traceable } from "../debug/Traceable";
import { debug, isObject } from "@rue/utils";
import { Ion, Methods, MutableIon } from "./Ion";
import { getActiveTracker, trackAtom } from "../ionic/IonicCompound";
import { $activeUpdate, getActiveUpdate, isLazyUpdate, Update, initUpdate } from "../effect-cycle/ReactivitySystem";
import { IonizedModel } from "../ionized/IonizedModel";
import { IonizedModelQuark } from "../ionized/IonizedModelQuark";

export const NULL = Symbol('null')
/** INTERNAL */
export type $AtomicIonState =
   MutableIon<unknown>
   // & MutableCapsule
   // & MutableEntity
   & {
      [QUARK]: {
         props: AnyObject | undefined;
         state: State,
         // state: any,
         // pState: any | typeof NULL,
         ionized: boolean,
         asTraceable: Traceable,
         // asPion: undefined | {
         //    models: undefined | IonizedModelQuark[]
         //    addModel(quark: IonizedModelQuark): void
         //    setPionState(quark: IonizedModelQuark, value: any): void
         // }
      }
      & Quark<typeof ATOMIC_ION, $AtomicIonState>
      & Watchable
   }


/** 
 * INTERNAL 
 * For reactive ions only.
 * */
export type AtomicIonQuark = QuarkOf<$AtomicIonState>

export function shouldIonize(newValue: unknown, ionized: boolean): newValue is AnyObject {
   return isObject(newValue) && Boolean(ionized);
}

export const IONIZED = true
export const ALL_METHODS = 'all_methods'

interface State {
   current: unknown
   pending: unknown
   commitChange(): void
   cancelChange(): void
   recordChange(newState: unknown, oldState: unknown): void
}

export class IonState implements State {

   constructor(
      public current: unknown
   ) { }

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
}

export class PionState implements State {
   constructor(
      private modelState: ModelState,
      public key: PropertyKey,
      private clone: (current: AnyObject) => AnyObject
   ) { }

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
         this.modelState.pending = this.clone(this.modelState.current)
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




/** INTERNAL */
export function createAtomicIon(
   state: State,
   props?: Methods,
   ionized: boolean = false,
) {
   const $state = (() => {
      if (__DEV__) emitSignal();
      trackAtom(quark)
      if (isLazyUpdate()) {
         return state.pending;
      }
      return state.current;
   }) as $AtomicIonState


   const quark: AtomicIonQuark = {
      state,
      // pState: NULL,
      pendingUpdate: null,
      ionized,
      props,
      entity: $state,
      quarkType: ATOMIC_ION,
      asTraceable: new Traceable(),
      trigger,
      asWatchedAtom: undefined,

      // asPion: isPion ? {
      //    models: undefined,
      //    setPionState(modelQuark: IonizedModelQuark, value: any) {
      //       this.addModel(modelQuark);
      //       setState(quark, value) //TODO: need to incorporate setters
      //    },
      //    addModel(quark: IonizedModelQuark) {
      //       const models = this.models ?? (this.models = [])
      //       if (models.indexOf(quark) === -1) {
      //          models.push(quark)
      //       }
      //    }
      // } : undefined
   }

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


function setState(this: AtomicIonQuark, value: unknown) {
   const state = this.state

   const oldState = isLazyUpdate() ? state.pending : state.current;
   // const oldState = this.state; //TODO: depends on lazy context

   if (value === oldState) {
      return value;
   }
   const newState = shouldIonize(value, this.ionized) ? ionize(value) : value //TODO: this should be an assertion rather than auto-transform, right?

   const update = initUpdate()

   if (update.lazy) {
      state.pending = newState

      update.queue(() => {
         state.commitChange()
         state.recordChange(newState, oldState)
         this.pendingUpdate = null;
      })

      if (this.pendingUpdate && this.pendingUpdate !== update) {
         this.pendingUpdate.cancel()
      }
   }
   else {
      if (this.pendingUpdate && this.pendingUpdate !== update) {
         this.pendingUpdate.cancel()
         state.cancelChange
         this.pendingUpdate = null;
      }

      state.current = newState;

      state.recordChange(newState, oldState)

      update.queue(() => {
         this.pendingUpdate = null;
      })
   }

   this.pendingUpdate = update

   this.trigger()

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