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

/** INTERNAL */
export function createAtomicIon(
   state: any,
   methods?: object,
   ionized: boolean = false
) {
   const $state = (() => {
      if (__DEV__) emitSignal();
      getActiveTracker()?.track(ion)
      return ion.state;
   }) as $AtomicIonState


   const ion: AtomicIonQuark = {
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
      unwatch: () => unwatch.call(ion)
   }

   if (methods) {
      return createAtomicIonWithMethods(ion)
   }

   $state[QUARK] = ion

   Object.defineProperty($state, 'state', {
      get: getState.bind(ion),
      set: setState.bind(ion)
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
   return this.state;
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




function createGetState(getter: undefined | (() => unknown), quark: AtomicIonQuark) {
   if (getter) {
      return () => {
         getter()
         return getState.call(quark);
      }
   }
   return getState.bind(quark)
}

function createAtomicIonWithMethods(quark: AtomicIonQuark, methods: AnyObject) {
   const descriptors = 'state' in methods ? Object.getOwnPropertyDescriptor(methods, 'state') : undefined
   let _getState: undefined | (() => unknown);
   let _setState: undefined | ((value: unknown) => unknown);

   const $stateCapsule = new Proxy(quark.entity, {
      get(target, key) {
         if (key === 'state') return _getState ? _getState() : (_getState = createGetState(descriptors?.get, quark))

         const value = values.get(key);
         if (value) return value;

         return initialAccess(
            methods,
            key,
            values
         )
      },
      set(target, key, value) {
         if (key === 'state') {
            setState.apply(quark, [value])
            return true;
         }
         debug.error(`${String(key)} is not a writable property`)
         return false;
      }
   })

   const values = new Map<string | symbol, unknown>([
      [QUARK as any, quark]
   ])

   quark.entity = $stateCapsule
   return $stateCapsule
}

function initialAccess(
   methods: AnyObject,
   key: PropertyKey,
   values: Map<PropertyKey, unknown>
) {

   const sourceValue = methods

   return value;
}