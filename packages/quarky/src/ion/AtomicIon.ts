import { emitSignal } from "../debug/debug";
import { ionize } from "../ionized/ionize";
import { AnyObject } from "@rue/types";
import { __DEV__getTrace, } from "../../../flask/debug";
import { __DEV__trace } from "../debug/debug";
import { EntityQuark, HasQuark, hasQuark, Quark, QUARK, QuarkOf, quarkOf } from "../Quark";
import { MutableCapsule } from "../capsule/Capsule";
import { unwatch, watch, Watchable } from "../watch/Watched";
import { Mutable, MutableEntity, Mutation, recordMutation } from "../Mutable";
import { trigger } from "../ReactivitySystem";
import { getActiveTracker } from "../ionic/IonicCompound";
import { ParticleMorph } from "../compound/Particle";
import { runSyncEffects } from "../effect-cycle/SyncEffects";
import { Traceable } from "../debug/Traceable";
import { debug, isObject } from "@rue/utils";
import { Ion, Methods, MutableIon } from "./Ion";


/** INTERNAL */
export type $AtomicIonState = MutableIon<unknown> & MutableCapsule & {
   [QUARK]: _AtomicIonQuark & EntityQuark<$AtomicIonState> & ParticleMorph & Watchable
} & MutableEntity

type _AtomicIonQuark = {
   type: symbol;
   mutable: boolean;
   props: AnyObject | undefined;
   state: any
   // stateKey: string
   ionized: boolean,
   trigger(): void
}

/** 
 * INTERNAL 
 * For reactive ions only.
 * */
export type AtomicIonQuark = QuarkOf<$AtomicIonState>

export function shouldIonize(newValue: unknown, ionized: boolean): newValue is AnyObject {
   return isObject(newValue) && Boolean(ionized);
}

export const MUTABLE = true
export const IONIZED = true
export const ALL_METHODS = 'all_methods'
const SELECTED_METHODS = Symbol('selected_methods')
const REINED_QUARK = Symbol('reined-ion-quark')

/** INTERNAL */
export function createAtomicIon(
   state: any,
   props?: Methods,
   mutable: boolean = true,
   ionized: boolean = false
) {
   const $state = (() => {
      if (__DEV__) emitSignal();
      getActiveTracker()?.track(quark)
      return quark.state;
   }) as $AtomicIonState


   const quark: AtomicIonQuark = {
      state,
      // stateKey,
      ionized,
      mutable,
      props,
      entity: $state,
      type: ATOMIC_ION,
      asMutable: new Mutable(),
      asParticle: undefined,
      asWatched: undefined,
      asTraceable: new Traceable(),
      trigger,
      watch,
      unwatch: () => unwatch.call(quark)
   }

   $state[QUARK] = quark

   if (mutable)
      // public properties
   
   if (props) {
      Object.defineProperty(props, 'state', {
         get: $state,
         set: setState.bind(quark)
      })
      Object.defineProperties($state, Object.getOwnPropertyDescriptors(props))
      // return quark.entity = createAtomicIonWithMethods(quark, mutable)
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
   return hasQuark(value) && quarkOf(<$AtomicIonState>value).type === ATOMIC_ION
}

export function isAtomicIonQuark(value: unknown): value is AtomicIonQuark {
   return value instanceof Object && 'type' in value && value.type === ATOMIC_ION
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
type ReinedIonQuark = { mutable: boolean, selectedMethods: Set<string> }

type PropertyMap = Map<PropertyKey, () => unknown>

// function createAtomicIonWithMethods(quark: AtomicIonQuark, mutable: boolean, selectedMethods?: Set<string>, reinedQuark?: ReinedIonQuark) {
//    const stateKey = quark.stateKey;
//    const methods = quark.methods;
//    const $state = quark.entity
//    if (!methods) throw new Error('methods missing')

//    const thisIon = Object.create(methods, {
//       [stateKey]: {
//          get: $state,
//          set: setState.bind(quark)
//       }
//    })

//    const propertyMap = new Map([
//       [QUARK as PropertyKey, () => quark as unknown],
//       [REINED_QUARK, () => reinedQuark],
//       ['name', () => '$stateCapsule'],
//       ['length', () => 0],
//       ['state', $state],
//       ['with_only', (...keys: string[]) => {
//          if (keys[0] === ALL_METHODS) {
//             return $stateCapsule
//          }
//          return { [SELECTED_METHODS]: keys, capsule: $stateCapsule }
//       }]
//    ])

//    const $stateCapsule = new Proxy($state, {
//       get(target, key) {
//          const getValue = propertyMap.get(key)
//          return getValue ? getValue() : initialMethodAccess(key, methods, propertyMap, thisIon, selectedMethods)
//       },
//       set(target, key, value) {
//          if (mutable && key === 'state') {
//             setState.apply(quark, [value])
//             return true;
//          }
//          debug.error(`${String(key)} is not a writable property`)
//          return false;
//       },
//       has(target, key) {
//          return key in publicIon || (selectedMethods ? selectedMethods.has(key as string) : key in methods)
//       }
//    })

//    return $stateCapsule
// }

// function initialMethodAccess(key: PropertyKey, methods: AnyObject, propertyMap: PropertyMap, thisIon: AnyObject, selectedMethods?: Set<PropertyKey>){
//    if (selectedMethods && !selectedMethods.has(key)) {
//       const blockedMethod = useBlockedMethod(key);
//       propertyMap.set(key, blockedMethod);
//       return blockedMethod
//    }
//    const boundMethod = methods[key]?.bind(thisIon)
//    propertyMap.set(key, boundMethod);
//    return boundMethod;
// }

// function getMethod(boundMethods: AnyObject, methods: AnyObject, key: PropertyKey, thisIon: AnyObject, selectedMethods?: Set<PropertyKey>) {
//    const boundMethod = boundMethods[key]
//    const rawMethod = methods[key]
//    if (boundMethod !== rawMethod) return boundMethod;
//    if (selectedMethods && !selectedMethods.has(key)) {
//       return boundMethods[key] = useBlockedMethod(key);
//    }
//    return boundMethods[key] = rawMethod?.bind(thisIon)
// }

// const NO_METHODS: Set<string> = new Set()

// /** INTERNAL */
// export function asReadonlyIon(ion: $AtomicIonState) {
//    const quark = quarkOf(ion)
//    if (quark.asReadonly) return quark.asReadonly;
//    if (quark.mutable || quark.methods)
//       return createReadonlyAtomicIon(quark)
//    return quark.asReadonly = ion;
// }

// function useBlockedMethod(key: PropertyKey) {
//    return function restrictedMethod() {
//       throw new Error(`The method '${String(key)}' has been restricted by another component`)
//    }
// }


// /** INTERNAL */
// function createReadonlyAtomicIon(
//    quark: AtomicIonQuark,
// ) {
//    const originalIon = quark.entity
//    const methods = quark.methods

//    const $state = function $readonlyState() {
//       return originalIon();
//    } as Ion & AnyObject;

//    $state[QUARK] = quark
//    $state[REINED_QUARK] = {
//       mutable: false,
//       selectedMethods: NO_METHODS
//    }

//    quark.asReadonly = $state

//    if (methods) {
//       attachCapsuleMethods($state, methods, undefined, NO_METHODS)
//    }

//    return $state
// }

// /** INTERNAL */
// function createReinedAtomicIon(
//    quark: AtomicIonQuark,
//    mutable: boolean,
//    selectedMethods?: Set<string>,
//    parentSelectedMethods?: Set<string>
// ) {
//    const originalIon = quark.entity
//    const methods = quark.methods

//    const $state = function $reinedState() {
//       return originalIon();
//    } as AnyObject & Ion;

//    $state[QUARK] = quark
//    $state[REINED_QUARK] = {
//       mutable,
//       selectedMethods
//    }

//    if (mutable)
//       Object.defineProperty($state, 'state', {
//          get: $state,
//          set: setState.bind(quark)
//       })

//    if (methods) {
//       attachCapsuleMethods($state, methods, quark.thisIon, selectedMethods, parentSelectedMethods)
//    }

//    return $state
// }


// export type $ReadonlyState = Ion & {
//    [QUARK]: _AtomicIonQuark & EntityQuark<$AtomicIonState> & ParticleMorph & Watchable
// }

// function createProxyWithAllMethods(quark: AtomicIonQuark, boundMethods: Methods, thisIon: Methods, mutable: boolean) {
//    const methods = quark.methods!;
//    return new Proxy(quark.entity, {
//       get(target, key) {
//          if (key === QUARK) return quark;
//          if (key in target) return target[key]
//          else return getMethod(boundMethods, methods, key, thisIon)
//       },
//       set: useSetTrap(quark, mutable)
//    })
// }


// function createProxyWithSelectMethods(quark: AtomicIonQuark, boundMethods: Methods, thisIon: Methods, mutable: boolean, _selectedMethods: string[]) {
//    const selectedMethods = new Set(_selectedMethods)
//    const methods = quark.methods!;

//    return new Proxy(quark.entity, {
//       get(target, key) {
//          if (key === QUARK) return quark;
//          if (key in target) return target[key]
//          else return getMethod(boundMethods, methods, key, thisIon, selectedMethods)
//       },
//       set: useSetTrap(quark, mutable)
//    })
// }

// function useSetTrap(quark: AtomicIonQuark, mutable: boolean) {
//    return function set(target: AnyObject & Ion & HasQuark, key: PropertyKey, value: unknown) {
//       if (mutable && key === 'state') {
//          setState.apply(quark, [value])
//          return true;
//       }
//       debug.error(`${String(key)} is not a writable property`)
//       return false;
//    }
// }


// export function asReinedIon(ion: $AtomicIonState, mutable: boolean, selectedMethods?: string[]) {
//    const reinedQuark = (<{ [REINED_QUARK]: ReinedIonQuark }><unknown>ion)[REINED_QUARK]
//    if (reinedQuark && !reinedQuark.mutable && mutable) throw new Error('Cannot make readonly object mutable')
//    return createReinedAtomicIon(quarkOf(ion), mutable, selectedMethods ? new Set(selectedMethods) : undefined, reinedQuark?.selectedMethods)
// }
