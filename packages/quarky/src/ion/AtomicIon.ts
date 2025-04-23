import { emitSignal } from "../debug/debug";
import { ionize } from "../ionized/ionize";
import { AnyObject } from "@rue/types";
import { __DEV__getTrace, } from "../../../flask/debug";
import { __DEV__trace } from "../debug/debug";
import { EntityQuark, hasQuark, QUARK, QuarkOf, quarkOf } from "../Quark";
import { attachCapsuleMethods, MutableCapsule } from "../capsule/Capsule";
import { unwatch, watch, Watchable } from "../watch/Watched";
import { Mutable, MutableEntity, Mutation, recordMutation } from "../Mutable";
import { trigger } from "../ReactivitySystem";
import { getActiveTracker } from "../ionic/IonicCompound";
import { ParticleMorph } from "../compound/Particle";
import { runSyncEffects } from "../effect-cycle/SyncEffects";
import { Traceable } from "../debug/Traceable";
import { debug, isObject } from "@rue/utils";
import { AtomicIon, Ion, Methods } from "./Ion";
import { createProxySwitchMap } from "../ionized/IonizedModel";

/** INTERNAL */
export type $AtomicIonState = AtomicIon & MutableCapsule & {
   [QUARK]: _AtomicIonQuark & EntityQuark<$AtomicIonState> & ParticleMorph & Watchable
} & MutableEntity

type _AtomicIonQuark = {
   type: symbol;
   mutable: boolean;
   methods: Methods | undefined;
   state: any
   stateKey: string
   ionized: boolean | typeof MUTABLE_IONIZED,
   trigger(): void
}

/** 
 * INTERNAL 
 * For reactive ions only.
 * */
export type AtomicIonQuark = QuarkOf<$AtomicIonState>

export function shouldIonize(newValue: unknown, ionized: boolean | typeof MUTABLE_IONIZED): newValue is AnyObject {
   return isObject(newValue) && Boolean(ionized);
}

export const MUTABLE = true
export const IONIZED = true
export const MUTABLE_IONIZED = 'mutable'
export const ALL_METHODS = 'all_methods'
const SELECTED_METHODS = Symbol('selected_methods')

/** INTERNAL */
export function createAtomicIon(
   state: any,
   stateKey: string,
   methods?: Methods,
   mutable: boolean = false,
   ionized: boolean | typeof MUTABLE_IONIZED = false
) {
   const $state = (() => {
      if (__DEV__) emitSignal();
      getActiveTracker()?.track(quark)
      return quark.state;
   }) as $AtomicIonState


   const quark: AtomicIonQuark = {
      state,
      stateKey,
      ionized,
      mutable,
      methods,
      entity: $state,
      type: ATOMIC_ION,
      asMutable: new Mutable(),
      asParticle: undefined,
      asWatched: undefined,
      asReadonly: undefined,
      asReined: undefined,
      asTraceable: new Traceable(),
      trigger,
      watch,
      unwatch: () => unwatch.call(quark)
   }

   $state[QUARK] = quark

   if (mutable)
      Object.defineProperty($state, 'state', {
         get: getState.bind(quark),
         set: setState.bind(quark)
      })

   if (methods) {

      return createAtomicIonWithMethods(quark, mutable)
   }

   return $state
}

const ATOMIC_ION = Symbol('atomic ion')

/**
 * INTERNAL
 */
export function isAtomicIon(value: unknown): value is $AtomicIonState {
   return hasQuark(value) && quarkOf(<$AtomicIonState>value).type === ATOMIC_ION
}

export function isAtomicIonQuark(value: unknown): value is AtomicIonQuark {
   return value instanceof Object && 'type' in value && value.type === ATOMIC_ION
}

function getState(this: AtomicIonQuark) {
   return this.entity();
}

function setState(this: AtomicIonQuark, value: unknown) {
   const oldState = this.state;

   if (value === oldState) {
      return value;
   }
   const state = shouldIonize(value, this.ionized) ? ionize(value) : value
   this.state = state;

   recordMutation(this, new Mutation(
      this.entity,
      '[[set]]',
      ['state', state],
      state,
      oldState
   ))

   this.trigger()

   runSyncEffects()

   return state;
}




// function createGetState(getter: undefined | (() => unknown), quark: AtomicIonQuark) {
//    if (getter) {
//       return () => {
//          getter()
//          return getState.call(quark);
//       }
//    }
//    return getState.bind(quark)
// }

// mutable ion: 
//
// state { count: 0 }  << extract key and value
// methods { increment(){} } << use as is
//
// PUBLIC ion (proxy) << readonly is just the function
// $count.state (get, set, bound to quark) (<< reined doesn't need this )
// $count.increment() (bound to private this)
//
// PRIVATE this Object.create(methods)
// this.count (get, set, bound to quark)
// this.increment()  (bound to private this)
//
// 


function createAtomicIonWithMethods(quark: AtomicIonQuark, mutable: boolean, selectedMethods?: string[]) {
   const stateKey = quark.stateKey;
   const methods = quark.methods;
   if (!methods) throw new Error('methods missing')

   const thisIon = Object.create(methods, {
      [stateKey]: {
         get: getState.bind(quark),
         set: setState.bind(quark)
      }
   })

   const boundMethods = Object.create(methods, {
      wM: {
         value: (...keys: string[]) => {
            if (keys[0] === ALL_METHODS) {
               return $stateCapsule
            }
            return { [SELECTED_METHODS]: keys, capsule: $stateCapsule }
         }
      }
   })

   const $stateCapsule = selectedMethods ?
      createProxyWithSelectMethods(quark, boundMethods, thisIon, mutable, selectedMethods)
      : createProxyWithAllMethods(quark, boundMethods, thisIon, mutable)

   quark.entity = $stateCapsule
   return $stateCapsule
}

function getMethod(boundMethods: AnyObject, methods: AnyObject, key: PropertyKey, thisIon: AnyObject, selectedMethods?: Set<PropertyKey>) {
   const boundMethod = boundMethods[key]
   const rawMethod = methods[key]
   if (boundMethod !== rawMethod) return boundMethod;
   if (selectedMethods && !selectedMethods.has(key)) {
      return boundMethods[key] = undefined;
   }
   return boundMethods[key] = rawMethod.bind(thisIon)
}

/** INTERNAL */
export function asReadonlyIon(ion: $AtomicIonState){
   return createReadonlyAtomicIon(quarkOf(ion))
}


/** INTERNAL */
function createReadonlyAtomicIon(
   quark: AtomicIonQuark,
) {
   const originalIon = quark.entity

   const $state = ((quark.mutable || quark.methods) ? function $readonlyState() {
      return originalIon();
   } : originalIon) as unknown as $ReadonlyState;

   $state[QUARK] = quark

   quark.asReadonly = $state

   return $state
}


export type $ReadonlyState = Ion & {
   [QUARK]: _AtomicIonQuark & EntityQuark<$AtomicIonState> & ParticleMorph & Watchable
}

function createProxyWithAllMethods(quark: AtomicIonQuark, boundMethods: Methods, thisIon: Methods, mutable: boolean) {
   const methods = quark.methods!;
   return new Proxy(quark.entity, {
      get(target, key) {
         if (key in target) return target[key]
         else return getMethod(boundMethods, methods, key, thisIon)
      },
      set(target, key, value) {
         if (mutable && key === 'state') {
            setState.apply(quark, [value])
            return true;
         }
         debug.error(`${String(key)} is not a writable property`)
         return false;
      }
   })
}

const NONLOCAL_MUTABLE = Symbol('nonlocalMutable')

function createProxyWithSelectMethods(quark: AtomicIonQuark, boundMethods: Methods, thisIon: Methods, mutable: boolean, _selectedMethods: string[]) {
   const selectedMethods = new Set(_selectedMethods)
   const methods = quark.methods!;
   return new Proxy(quark.entity, {
      get(target, key) {
         if (key in target) return target[key]
         else return getMethod(boundMethods, methods, key, thisIon, selectedMethods)
      },
      set(target, key, value) {
         if (key === NONLOCAL_MUTABLE) {
            if (quark.mutable && value === false)
               mutable = value;
         }
         if (mutable && key === 'state') {
            setState.apply(quark, [value])
            return true;
         }
         debug.error(`${String(key)} is not a writable property`)
         return false;
      }
   })
}


export function asReinedIon(ion: $AtomicIonState, selectedMethods: string[], mutable: boolean){
   return createReinedAtomicIon(quarkOf(ion), mutable, selectedMethods)
}

export function createReinedAtomicIon(
   quark: AtomicIonQuark,
   mutable: boolean,
   _selectedMethods: string[]
) {
   return createAtomicIonWithMethods(quark, mutable, _selectedMethods)
}