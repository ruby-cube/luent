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
import { AtomicIon } from "./Ion";
import { createProxySwitchMap } from "../ionized/IonizedModel";

/** INTERNAL */
export type $AtomicIonState = AtomicIon & MutableCapsule & {
   [QUARK]: {
      type: symbol;
      state: any,
      ionized: boolean,
      trigger(): void
   } & EntityQuark<$AtomicIonState> & ParticleMorph & Watchable
} & MutableEntity

/** 
 * INTERNAL 
 * For reactive ions only.
 * */
export type AtomicIonQuark = QuarkOf<$AtomicIonState>

export function shouldIonize(newValue: unknown, ionized: boolean): newValue is AnyObject {
   return isObject(newValue) && ionized;
}

export const MUTABLE = true
export const IONIZED = true
export const MUTABLE_IONIZED = 'mutable'

/** INTERNAL */
export function createAtomicIon(
   state: any,
   stateKey: string,
   methods?: object,
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
      ionized,
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

   if (methods) {
      return createAtomicIonWithMethods(quark, stateKey, methods, mutable)
   }

   $state[QUARK] = quark

   if (mutable)
      Object.defineProperty($state, 'state', {
         get: getState.bind(quark),
         set: setState.bind(quark)
      })

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


function createAtomicIonWithMethods(quark: AtomicIonQuark, stateKey: string, methods: AnyObject, mutable: boolean) {
   const thisIon = Object.create(methods, {
      [stateKey]: {
         get: getState.bind(quark),
         set: getState.bind(quark)
      }
   })

   const $ion: AnyObject = {
      name: '$stateCapsule',
      length: 0
   }

   const $stateCapsule = new Proxy(quark.entity, {
      get(target, key) {
         if (mutable && key === 'state') return thisIon[stateKey]
         if (key in $ion) return $ion[key]
         else return thisIon[key]
      },
      set(target, key, value) {
         if (mutable && key === stateKey || key === 'state') {
            setState.apply(quark, [value])
            return true;
         }
         debug.error(`${String(key)} is not a writable property`)
         return false;
      }
   })

   quark.entity = $stateCapsule
   return $stateCapsule
}