import { AnyObject } from "@rue/types";
import { isIonizedModel, isIonKey, toRaw } from "./ionize";
import { __DEV__asTraceable, emitSignal } from "../debug/debug";
import { asAtomicOp, $atomicOp, getAtomicOps } from "./AtomicOp";
import { storeSnapshot } from "./ionize";
import { ModelQuark } from "./ModelQuark";
import { debug, isFunction, isObject, noop } from "@rue/utils";
import { Ion, isIon } from "../ion/Ion";
import { __DEV__trace } from "../debug/debug";
import { hasQuark, QUARK, quarkOf } from "../Quark";
import { Capsule } from "../capsule/Capsule";
import { MutableEntity, Mutation, recordMutation } from "../Mutable";
import { isWatchable, Watchable } from "../watch/WatchedAtom";
// import { IonizedCompound } from "./IonizedCompound";
import { getIonizedMethodDef, TriggeringOpDef, TrackableOpDef } from "./IonizedMethods";
import { isInert } from "./inert";
import { initUpdate, isLazyUpdate, popUpdate, pushUpdate, Update } from "../effect-cycle/ReactivitySystem";
import { $AtomicIonState, AtomicIonQuark, AtomicQuark, createAtomicIon, ModelState, NULL, PionState, setState } from "../ion/AtomicIon";
import { isTracking, trackParticle } from "../compound/Compound";
import { isIntegerKey } from "./IonizedArray";
import { trackOp } from "./OpDefinitions";

export function $atomicPion(
   modelQuark: ModelQuark,
   key: PropertyKey,
) {
   const pion = modelQuark.pions[key]
   if (pion instanceof Map) throw new Error(`${key.toString()} is not a pion`)
   return pion;
}

// // /** INTERNAL */
export type IonizedModel = {
   [QUARK]: Watchable & ModelQuark
} & Capsule & MutableEntity & AnyObject

// for inert properties use absorbed neutrons
// const frog = ionized({
//    name: neutron('kermit'),
//    age: 0
// })

export const UNDEFINED_OP: Function = noop


// export const insertOps = {
//     push: { from: 0 },
//     unshift: { from: 0 },
//     splice: { from: 2 },
//     fill: { at: 0 },
//     add: { at: 0 },
//     set: { from: 0 }
// }

// export function maybeDeionizeArgs(
//     op: string,
//     args: any[],
// ) {
//     if (!(op in insertOps)) return args;

//     const itemPosition = insertOps[<keyof typeof insertOps>op]
//     const hasSingleItem = 'at' in itemPosition
//     const newItems = hasSingleItem ? [args[itemPosition.at]] : args.slice(itemPosition.from);
//     const _newItems: any[] = [];
//     for (const newItem of newItems) {
//         _newItems.push(toRaw(newItem))
//     }
//     if (hasSingleItem) {
//         args[itemPosition.at] = _newItems[0];
//     }
//     else {
//         args.splice(itemPosition.from, _newItems.length, ..._newItems)
//     }
//     return args;
// }


//API
// export function defineIonizedStructure(structureKey: any, config: CustomIonizedModelConfig, override?: boolean) {
//    const existing = ionicStructureMap.get(structureKey)
//    if (existing && !override) {
//       console.warn(`Ionic structure already defined for the structure key, ${structureKey.toString()}. To override, pass in override parameter as true.`)
//       return;
//    }
//    config.structure = structureKey;
//    // const { isEntryKey } = config
//    // if (isEntryKey) {
//    //    registerEntryKeyValidator(isEntryKey)
//    // }

//    ionicStructureMap.set(structureKey, config)
// }





// export function getStructureConfigs(target: AnyObject) {
//    return getStructureConfig(target, [])
// }

// function getStructureConfig(target: AnyObject, configs: any[]) {
//    const proto = Object.getPrototypeOf(target); //TODO: custom get data structure for factory functions
//    if (!proto) return configs;
//    const constructor = proto.constructor;
//    if (!isCustomIonicStructure(constructor)) {
//       return getStructureConfig(proto, configs)
//    }
//    const config = ionicStructureMap.get(constructor)
//    if (config) configs.push(config);
//    return getStructureConfig(proto, configs)
// }


// export type CustomIonizedModelConfig = {
//    structure?: any;
//    nontrackableKeys?: { [key: ProxyKey]: boolean };
//    trackableOps?: { [key: ProxyKey]: CreateTrackableOp }
//    mutatingOps?: { [key: ProxyKey]: MutatingOpConfig };
//    beforeSet?: BeforeSetCallback; //TODO:
//    afterSet?: AfterSetCallback;
//    isEntryKey?: (model: AnyObject, key: ProxyKey) => boolean
//    // getStructureKeys: (model: AnyObject) => any[]
// }

// type BeforeSetCallback = (ionizedModel: IonizedModel, meta: ModelQuark, key: ProxyKey, oldValue: any) => void
// type AfterSetCallback = (ionizedModel: IonizedModel, meta: ModelQuark, key: ProxyKey, newValue: any, oldValue: any) => void


// type CreateTrackableOp = (
//    target: AnyObject,
//    model: IonizedModel,
//    op: ProxyKey,
//    transformInput?: (args: any[]) => any[],
//    transformTarget?: (target: AnyObject, args: any[]) => AnyObject,
//    transformOutput?: (output: any) => any
// ) => (...args: any[]) => any


// type MutatingOpConfig = {
//    createOp: (state: ModelState, ionizedModel: IonizedModel, meta: any, getPreopData: GetPreopData | undefined) => (...args: any[]) => any
//    preop?: GetPreopData
//    revert?: Revert
// }

export type GetPreopData = (target: AnyObject, args?: any[]) => any;
// type Revert = (model: AnyObject, data: { output: any, preopData: any, args: any[] }) => void



// a `trackable op` is a method like 'values()' or 'entries()' that tracks the entire ionic model as a watch subject rather than a specific entry or property
export function useTrackableOp(
   method: Function,
   state: ModelState,
   ionized: IonizedModel,
   opKey: ProxyKey,
   config: TrackableOpDef,
) {
   const { op, track, input = noTransform, output = noTransform, this: transformThis = noTransform } = config

   const fn = op ?? method

   return function trackableOp(...args: any[]) {
      if (__DEV__) emitSignal();
      const _args = input(args);
      track(ionized, opKey, _args)
      return output(fn.apply(transformThis(state.active, _args), _args), ionized)
   }
}

// function asTrackable(tracked: [IonizedModel] | [IonizedModel, ProxyKey, any[]]) {
//    const [model, op, input] = tracked;
//    if (op) {
//       return asAtomicOp(model, op, input![0]) //TODO: atomicOps that have more than one 'entry key'
//    } else {
//       return quarkOf(model)
//    }
// }





function noTransform(value: any) {
   return value;
}

// a `trackable op` is a method like 'filter' that tracks the entire ionic model as a watch subject rather than a specific entry or property
// and also receives a callback that receives property values of the model
// export function useTrackableOpWithCallback(
//    model: IonizedModel,
//    target: AnyObject,
//    op: ProxyKey,
//    ionizeArgs?: (args: any[]) => any[]
// ) {
//    const fn = target[op]
//    return function trackableOp(...args: any[]) {
//       console.log('calling trackableOp with decoy')
//       if (__DEV__) emitSignal();
//       const _args = ionizeArgs ? ionizeArgs(args) : args;
//       getActiveTracker()?.track(quarkOf(model))
//       return fn.call(ionizedDecoy(target), ..._args)
//    }
// }


// const ionicStructureMap = new Map([[
//    Object, {
//       keys: {
//          constructor: true,
//          __defineGetter__: true,
//          __defineSetter__: true,
//          // hasOwnProperty: true,
//          __lookupGetter__: true,
//          __lookupSetter__: true,
//          isPrototypeOf: true,
//          propertyIsEnumerable: true,
//          toString: true,
//          valueOf: true,
//          __proto__: true,
//          toLocaleString: true
//       }
//    }
// ]]) as Map<any, CustomIonizedModelConfig>

// function isCustomIonicStructure(value: any) {
//    return ionicStructureMap.has(value);
// }

// function getMutatingOps(DataStructure: any) {
//     const config = ionicStructureMap.get(DataStructure)
//     if (!config) throw new Error(`Cannot find config for this data structure: ${DataStructure.toString()}`)
//     return config.mutatingOps
// }

// function emitAfterSet(model: IonizedModel, key: ProxyKey, newValue: any, oldValue: any) {
//    const quark = quarkOf(model)
//    const configs = quark.structureConfigs;
//    if (configs[0].structure === Object) return;
//    for (const config of configs) {
//       const afterSet = config.afterSet
//       if (afterSet) afterSet(model, quark, key, newValue, oldValue)
//    }
// }


// function getNonTrackableKeys(structureKey: any) {
//    return ionicStructureMap.get(structureKey)?.nontrackableKeys
// }


// export function isNonTrackable(key: ProxyKey, structureConfigs: CustomIonizedModelConfig[]) { //TODO: ?
//    // for (const config of structureConfigs) {
//    //    const nontrackableKeys = config.nontrackableKeys
//    //    if (nontrackableKeys && key in nontrackableKeys) return true;
//    //    if (typeof key === 'symbol' && key.description && nontrackableKeys && key.description in nontrackableKeys) return true;
//    // }
//    return false;
// }

const INTERNAL_OP = "[[INTERNAL]]"
const KEY_IN_OP = "[[in]]"



// function initializeState(initialData: AnyObject) {
//    //TODO: should we do a structured clone instead using Object.getGetOwnProperties?
//    // - turn absorbed ions into getters
//    // - delete ion keys
//    for (const key in initialData) {
//       if (isIonKey(key)) {
//          const value = initialData[key]
//          if (isIon(value)) {
//             const stateKey = key.slice(1)
//             Object.defineProperty(initialData, stateKey, {
//                enumerable: true,
//                get: value
//             })
//             delete initialData[key];
//          }
//       }
//       else {
//          const value = initialData[key]
//          if (isIon(value)) {
//             Object.defineProperty(initialData, key, {
//                enumerable: true,
//                get: value
//             })
//          }
//       }
//    }
//    return initialData;
// }

const GET = 0 as const;
const SET = 1 as const;

type ProxyKey = string | symbol
type CloneFn = (entity: any) => any
function getCloner(entity: object): CloneFn {
   //TODO: get cloner from data structure configs
   if (entity instanceof Array) return (entity: any[]) => {
      return Object.assign([], entity)
   }
   if (entity instanceof Set) return (entity: Set<any>) => {
      return Object.assign(new Set(entity), entity)
   }
   if (entity instanceof Map) return (entity: Map<any, any>) => {
      return Object.assign(new Map(entity), entity)
   }
   return (entity: object) => {
      return Object.create(Object.getPrototypeOf(entity), Object.getOwnPropertyDescriptors(entity))
   }
}
function getIonizedConfig(target: AnyObject) {
   return {
      clone: getCloner(target),
      isAbsorbedIon: target instanceof Array ? (value: unknown, key: ProxyKey) => {
         if (isIntegerKey(key)) return false;
         return isIon(value);
      } : isIon
   }
}

function toIonKey(key: ProxyKey, target: AnyObject) {
   if (!isIonKey(key)) return undefined;
   if (key in target && !isIon(target[key])) return undefined;
   return key;
}

//TODO:
// - I really need to think through if property changes should trigger the whole model
// - adding and deleting properties
export function createIonizedModel(
   initialTarget: AnyObject,
   inertSchema: AnyObject | undefined,
) {

   const { clone, isAbsorbedIon } = getIonizedConfig(initialTarget)

   const state = new ModelState(initialTarget, clone)

   const proxyProto = Object.create(null) // state keys and ion access keys

   function initializeProperty(proxyProto: AnyObject, key: ProxyKey, op: typeof GET | typeof SET = GET, value: unknown = undefined): boolean {
      let target = initialTarget

      const ionKey = toIonKey(key, target);
      const stateKey = ionKey ? ionKey.slice(1) : key;

      let originalKey = key in target ? key : stateKey in target ? stateKey : undefined
      if (!originalKey) {
         if (op === SET) {
            if (isAbsorbedIon(value, key)) {
               //TODO: absorbed ion
               return true;
            }
            else if (isFunction(value)) {
               //TODO: method
               return true;
            }
            else {
               initializePion(proxyProto, stateKey, ionKey, state, modelQuark, { configurable: true, enumerable: true })
               return true;
            }
         }
         return false;
      }


      // initializedProperties[stateKey] = true;

      let isProto = false; // prototypes do not hold any state, only getters and methods
      do {
         const propertyDescriptor = Object.getOwnPropertyDescriptor(target, originalKey)
         if (propertyDescriptor) {
            if (propertyDescriptor.get || propertyDescriptor.set) {
               const opDef = getIonizedMethodDef(initialTarget, originalKey)
               if (opDef) {
                  propertyDescriptor.get = 'get' in opDef && propertyDescriptor.get ? useTrackableOp(propertyDescriptor.get, state, ionizedModel, '[[get]]', opDef.get!) : propertyDescriptor.get
                  propertyDescriptor.set = 'set' in opDef && propertyDescriptor.set ? useMutatingOp(propertyDescriptor.set, state, ionizedModel, '[[set]]', opDef.set!) : propertyDescriptor.set
                  Object.defineProperty(proxyProto, stateKey, propertyDescriptor)
                  return !!propertyDescriptor.set;
               }
               Object.defineProperty(proxyProto, stateKey, propertyDescriptor)
               return true;
            }
            else {
               const value = propertyDescriptor.value
               if (isAbsorbedIon(value, key)) {
                  initializeAbsorbedIon(
                     proxyProto,
                     stateKey,
                     value,
                     ionKey
                  )
                  return true;
               }
               else if (isFunction(value)) {
                  if (op === SET) {
                     // TODO: if setting method before it's initialized
                     return propertyDescriptor.writable ?? false;
                  }
                  const methodDef = getIonizedMethodDef(initialTarget, key) as TrackableOpDef | TriggeringOpDef
                  if (methodDef) { //NOTE: this block must be above target[_key] for Array.from(set) to work
                     bindNativeMethod(
                        proxyProto,
                        key,
                        propertyDescriptor,
                        methodDef,
                        state,
                        initialTarget,
                        ionizedModel
                     )
                     return propertyDescriptor.writable ?? false
                  }
                  bindMethod(
                     proxyProto,
                     key,
                     value,
                     propertyDescriptor,
                     ionizedModel
                  )
                  return propertyDescriptor.writable ?? false
               }
               else if (!isProto && propertyDescriptor.writable) {
                  if (isTracking() || ionKey) {
                     initializePion(
                        proxyProto,
                        stateKey,
                        ionKey,
                        state,
                        modelQuark,
                        propertyDescriptor
                     )
                     return true;
                  }
                  else {
                     // State access, no tracking
                     let _value = propertyDescriptor.value;
                     Object.defineProperty(proxyProto, stateKey, {
                        configurable: true,
                        enumerable: propertyDescriptor.enumerable,
                        get() {
                           if (isTracking()) {
                              const pion = initializePion(
                                 proxyProto,
                                 stateKey,
                                 ionKey,
                                 state,
                                 modelQuark,
                                 propertyDescriptor
                              )
                              return pion();
                           }
                           return maybeIonize(_value)
                        },
                        set(v) {
                           _value = v
                        }
                     })
                     return true;
                  }
               }
               else { // static property
                  Object.defineProperty(proxyProto, key, propertyDescriptor)
                  return false;
               }
            }
         }
         target = Object.getPrototypeOf(target)
         isProto = true;
      } while (target.constructor !== Object)
      return false;
   }

   const ionizedModel = new Proxy(proxyProto, {

      get(proxyProto, key, receiver) {
         __DEV__proxyGetterAssertions(ionizedModel, receiver)
         if (key in proxyProto) {
            return proxyProto[key]
         }
         initializeProperty(
            proxyProto,
            key
         )
         return proxyProto[key]
      },

      set(proxyProto, key, value) {
         if (key in proxyProto) {
            proxyProto[key] = value;
            return true;
         }
         const writable = initializeProperty(
            proxyProto,
            key,
            SET
         )
         proxyProto[key] = value;
         return writable;
      },

      has(proxyProto, key) {
         modelQuark.trackOp('[[in]]', key)
         //TODO: need to figure out how to deal with ion access keys
         return key in proxyProto || (key in initialTarget)
      },

      getOwnPropertyDescriptor(target, key) {
         //TODO: track
         return Reflect.getOwnPropertyDescriptor(target, key) //TODO: adjust key for absorbed ion
      },

      defineProperty(target: AnyObject, key, attributes) {
         const success = Reflect.defineProperty(state.active, key, attributes)
         if (!success) return false;
         const update = initModelUpdate(modelQuark)
         if (!(key in target)) {
            triggerKeysChange(modelQuark, key, update)
         }
         else if (target[key] !== attributes.value) {
            getPionQuark(target, key)?.trigger(update)
         }
         modelQuark.trigger(update)
         //TODO: record mutation?
         return true;
      },

      deleteProperty(target: AnyObject, key) {
         const pionQuark = getPionQuark(target, key)
         const success = Reflect.deleteProperty(state.active, key)
         if (!success) return false;
         
         const update =initModelUpdate(modelQuark)

         pionQuark?.trigger(update)
         if (key in target) {
            triggerKeysChange(modelQuark, key, update)
         }
         modelQuark.trigger(update)
         //TODO: record mutation?
         return true;
      },

      ownKeys() {
         modelQuark.trackOp(INTERNAL_OP, 'ownKeys') //TODO: trigger when any new property is added or deleted
         return Reflect.ownKeys(state.active)
      },

      getPrototypeOf(target) {
         return Reflect.getPrototypeOf(initialTarget)
      },

      setPrototypeOf(target, proto) {
         debug.warn("[DISALLOWED] Cannot setPrototypeOf ionized model")
         return false
      },

      isExtensible(target) {
         modelQuark.trackOp(INTERNAL_OP, 'isExtensible')
         return Reflect.isExtensible(state.active)
      },

      preventExtensions(target) {
         const update = initModelUpdate(modelQuark)
         $atomicOp(modelQuark, INTERNAL_OP, 'isExtensible')?.trigger(update)
         return Reflect.preventExtensions(state.active)
      },

   }) as unknown as IonizedModel

   const modelQuark = new ModelQuark(ionizedModel, initialTarget, state, clone)
   proxyProto[QUARK] = modelQuark

   // const setOp = useMutatingOp(initialTarget, ionizedModel, '[[set]]', triggeringPropertySetOp)


   registerIonizedModel(ionizedModel, initialTarget)
   // initializeSnapshots(target)
   return ionizedModel
}

export type ProxyPropertyMap = Record<ProxyKey, (() => any) | undefined>

function triggerKeysChange(quark: ModelQuark, key: ProxyKey, update: Update) {
   $atomicOp(quark, INTERNAL_OP, 'ownKeys')?.trigger(update)
   $atomicOp(quark, KEY_IN_OP, key)?.trigger(update)
   //QUESTION: shoule this trigger the whole model? I don't think so?
}

// function initialAccess(
//    target: AnyObject,
//    // marks: MarkMap | ShallowMark | undefined,
//    ionizedModel: IonizedModel,
//    quark: ModelQuark,
//    key: string | symbol,
//    proxyProto: ProxyPropertyMap,
// ) {
//    // if (methods && key in methods) {
//    //    return bindMethod(methods[key], key, ionizedModel, proxyProto)
//    // }
//    const nativeMethodDef = getIonizedMethodDef(target, key)
//    if (nativeMethodDef) { //NOTE: this block must be above target[_key] for Array.from(set) to work
//       return bindNativeMethod(
//          nativeMethodDef,
//          key,
//          target,
//          ionizedModel,
//          quark,
//          proxyProto,
//       )
//    }
//    const value = target[key]
//    if (isMethod(value)) {
//       return bindMethod(proxyProto, key, ionizedModel, proxyProto)
//    }
//    return initialPropertyAccess(
//       target,
//       ionizedModel,
//       key,
//       value,
//       proxyProto,
//       // marks
//    )
// }



function initializeAbsorbedIon(proxyProto: AnyObject, key: ProxyKey, value: Ion, ionKey: ProxyKey | undefined) {
   // absorbed ion
   Object.defineProperty(proxyProto, key, {
      enumerable: true,
      get: value,
      set: 'state' in value ? Object.getOwnPropertyDescriptor(value, 'state')?.set : undefined
   })
   if (ionKey) {
      // ion access
      Object.defineProperty(proxyProto, ionKey, {
         enumerable: false,
         value
      })
   }
}

// TODO:
// [] ionize objects

// function toIonKey(key: ProxyKey, initialTarget: AnyObject) {
//    if (typeof key !== 'string') return;
//    const ionKey = '$' + key
//    if (ionKey in initialTarget && !isIon(initialTarget[ionKey])) return;
//    return ionKey;
// }

// array integer properties should not absorb ions



// [] ion access key
//    - search with $-
//      - absorbed ion: return 
//    - search without $-  
//       - absorbed ion: return absorbed ion
//       - own ion --> create ion, atomic or memoized
// [] absorbed ion access
// [] get value --> bind to proxy, memoized derivation
// [] writable value access --> atomic ion
// [] undefined access
// [] configured method: 
//    - trackable
//    - mutating
// [] method
//  

function getPion(proxyProto: ProxyPropertyMap, key: ProxyKey) {
   const getter = Object.getOwnPropertyDescriptor(proxyProto, key)?.get
   if (!getter) return undefined;
   if (QUARK in getter) return getter as $AtomicIonState;
   return undefined;
}

function getPionQuark(proxyProto: ProxyPropertyMap, key: ProxyKey) {
   const pion = getPion(proxyProto, key)
   if (pion) return quarkOf(pion)
   return undefined;
}

/**
 * Case: ion access, ion already initialized (must retreive ion)
 * Case: ion access, ion not initialized
 * Case: state access, ion not initialized (initialize state access only)
 * 
 * @param proxyProto 
 * @param key 
 * @param ionKey 
 * @param state 
 * @param quark 
 * @param propertyDescriptor 
 * @returns 
 */
function initializePion(
   proxyProto: ProxyPropertyMap,
   stateKey: ProxyKey,
   ionKey: string | undefined,
   state: ModelState,
   quark: ModelQuark,
   propertyDescriptor: PropertyDescriptor
) {
   if (ionKey) {
      return initializePionAccess(proxyProto, stateKey, ionKey, state, quark, propertyDescriptor)
   } else {
      return createPion(proxyProto, stateKey, state, quark, propertyDescriptor)
   }
}

function initializePionAccess(
   proxyProto: ProxyPropertyMap,
   stateKey: ProxyKey,
   ionKey: string,
   state: ModelState,
   quark: ModelQuark,
   propertyDescriptor: PropertyDescriptor
) {
   const ion = getPion(proxyProto, stateKey) ?? createPion(proxyProto, stateKey, state, quark, propertyDescriptor)
   Object.defineProperty(proxyProto, ionKey, {
      enumerable: false,
      configurable: propertyDescriptor.configurable,
      value: ion,
      writable: false
   })
   return ion;
}

function createPion(
   proxyProto: ProxyPropertyMap,
   key: ProxyKey,
   state: ModelState,
   quark: ModelQuark,
   propertyDescriptor: PropertyDescriptor
) {
   const ion = createAtomicIon(new AtomicIonQuark(new PionState(state, key), true, quark))
   Object.defineProperty(proxyProto, key, {
      enumerable: propertyDescriptor.enumerable,
      configurable: propertyDescriptor.configurable,
      get: ion,
      set: Object.getOwnPropertyDescriptor(ion, 'state')!.set //NOTE: equivalent performance to storing setter on quark
   })
   return ion
}

// export function initialPropertyAccess(
//    target: AnyObject,
//    ionizedModel: IonizedModel,
//    // structureConfigs: CustomIonizedModelConfig[],
//    key: string | symbol,
//    value: any,
//    proxyProto: ProxyPropertyMap,
//    // marks: MarkMap | ShallowMark | undefined,
// ) {

//    // if (isNonTrackable(key)) { //QUESTION: is this worth it? //TODO: include non-writable properties
//    //    return initialNonTrackablePropertyAccess(target, key, value, proxyProto, transformValue);
//    // }

//    if (isIonKey(key)) {
//       return initialIonAccess(ionizedModel, target, key, value, proxyProto);
//    }

//    if (isIon(value)) {
//       return initialAbsorbedIonStateAccess(key, value, proxyProto)
//    }

//    return initialTrackableStateAccess(
//       ionizedModel,
//       target,
//       key,
//       value,
//       proxyProto,
//       // marks,
//    )
// }


//FIX: figure out where to call traceableMethodWrap
function bindMethod(proxyProto: ProxyPropertyMap, key: ProxyKey, method: Function, propertyDescriptor: PropertyDescriptor, ionizedModel: IonizedModel) {
   Object.defineProperty(proxyProto, key, {
      ...propertyDescriptor,
      value: method.bind(ionizedModel)
   })
}

// function initialNonTrackablePropertyAccess(
//    target: AnyObject,
//    key: string | symbol,
//    value: any,
//    proxyProto: ProxyPropertyMap,
//    transformValue: Function
// ) {
//    proxyProto.set(key, () => transformValue(target[key]))
//    return transformValue(value);
// }



// function initialIonAccess(
//    proxy: IonizedModel,
//    target: AnyObject,
//    key: string,
//    value: any,
//    proxyProto: ProxyPropertyMap,
// ) {
//    // CASE: Absorbed Ion { $count: $count }
//    if (isIon(value)) {
//       proxyProto[key] = () => value
//       return value; // { $count: $count } get ion case
//    }
//    const _key = key.slice(1);
//    if (value === undefined) {
//       // CASE: existing prop ion from previous state access
//       const ion = proxyProto[_key];
//       if (ion) {
//          proxyProto[key] = () => ion
//          return ion;
//       }

//       const _value = target[_key]
//       // CASE: absorbed ion { count: $count }
//       if (isIon(_value)) {
//          proxyProto[key] = () => _value
//          return _value;
//       }
//       // CASE: prop ion { count: 0 }
//       const pion = createPion(proxy, target, _key, value)
//       proxyProto[_key] = pion
//       proxyProto[key] = () => pion
//       return pion;
//    }
//    // Invalid property { $count: 0 } 
//    initialTrackableStateAccess(proxy, target, key, value, proxyProto)
//    if (__DEV__) console.warn('Invalid Property Key initialization: Property keys prefixed with a single dollar sign ($) are reserved for ions.\n' + __DEV__asTraceable(proxy).origin)
// }

function initialAbsorbedIonStateAccess(key: string | symbol, value: any, proxyProto: ProxyPropertyMap) {
   proxyProto[key] = value
   return value(); // { count: $count } get value case
}

// export function getTargetKey(methods: AnyObject, key: string | symbol) {
//    const keyWithoutUnderscorePrefix = typeof key === 'string' && key.startsWith('_') ? key.slice(1) : key;
//    if (keyWithoutUnderscorePrefix in methods) return keyWithoutUnderscorePrefix;
//    return key;
// }

function getTargetPropertyValue(target: AnyObject, key: string | symbol, receiver: AnyObject) {
   try {
      //TODO: decide whether to use Reflect.get or target[key], or when to use which
      // console.warn('Reflect.get failed with error, switched to target[key]:', err)
      return target[key]
   }
   catch (err) {
      console.warn('target[key] failed with error, switched to Reflect.get:', err)
      return Reflect.get(target, key, receiver) // TODO: deep readonly and reined
      /* 
      https://stackoverflow.com/questions/37199019/method-set-prototype-add-called-on-incompatible-receiver-undefined
      set.size causes incompatible reciever error. It may be because its a getter that uses 'this'
      */
   }
}

// function initialTrackableStateAccess(
//    ionizedModel: IonizedModel,
//    target: AnyObject,
//    key: ProxyKey,
//    value: any,
//    proxyProto: ProxyPropertyMap,
//    // inertSchema: MarkMap | InertCollectionType | undefined,
// ) {
//    const pion = createPion(ionizedModel, target, key, value)
//    proxyProto[key] = pion
//    return pion?.()
// }

// function createPion(ionizedModel: IonizedModel, target: AnyObject, key: ProxyKey, value: unknown) {
//    let isProto = false;
//    while (target.constructor !== Object) {
//       const propertyDescriptor = Object.getOwnPropertyDescriptor(target, key)
//       if (propertyDescriptor) {
//          if (propertyDescriptor.get)
//             return createManagedDerivation(() => propertyDescriptor.get!.apply(ionizedModel));
//          else if (!isProto && propertyDescriptor.writable) return createAtomicIon(new PionState(state, key, clone), undefined, true, true);
//          else return () => value; //FIX:
//       }
//       target = Object.getPrototypeOf(target)
//       isProto = true;
//    }
//    if (__DEV__) console.warn('RESEARCH: key is not found on object. This should theoretically never happen. Further investigation needed.')
//    return undefined;
// }


const ionizedModels: WeakMap<AnyObject, IonizedModel> = new WeakMap()

function registerIonizedModel(ionized: IonizedModel, target: AnyObject) {
   ionizedModels.set(target, ionized)
}

export function getIonizedModel(value: unknown) {
   return ionizedModels.get(value as AnyObject)
}



export function maybeIonize(value: any) {
   if (!isObject(value) || isInert(value)) {
      return value;
   }
   if (isIonizedModel(value)) return value;
   return ionizedModels.get(value) ?? createIonizedModel(value)
}


export function isMethod(value: any): value is Function {
   return value instanceof Function && !isIon(value)
}



// export function accessMethod(
//    target: AnyObject,
//    proxy: IonizedModel,
//    receiver: AnyObject,
//    key: ProxyKey,
//    boundMethodMap: Map<ProxyKey, Function>,
//    method?: Function
// ) {
//    return getBoundMethod(
//       proxy,
//       key,
//       boundMethodMap,
//       method
//    )
// }

//FIX: figure out where to call traceableMethodWrap
// function getBoundMethod(
//    proxy: IonizedModel,
//    key: ProxyKey,
//    boundMethodMap: Map<ProxyKey, Function>,
//    method?: Function
// ) {
//    let boundMethod = boundMethodMap.get(key)
//    if (boundMethod) return boundMethod;
//    if (method) {
//       boundMethod =
//          // __DEV__ ?
//          // traceableMethodWrap('Ionized Method', proxy, key, method.bind(proxy))
//          // : 
//          method.bind(proxy);
//       boundMethodMap.set(key, boundMethod!)
//       return boundMethod;
//    }
//    throw new Error('No method provided')
// }

// export function isNativeMethod(key: ProxyKey, structureConfigs: CustomIonizedModelConfig[]) {
//    for (const structure of structureConfigs) {
//       const mutatingOps = structure.mutatingOps
//       if (mutatingOps && key in mutatingOps)
//          return true;
//       const trackableOps = structure.trackableOps
//       if (trackableOps && key in trackableOps)
//          return true;
//    }
//    return false;
// }

// export function getNativeMethodConfig(
//    nativeKey: string | symbol,
//    structureConfigs: CustomIonizedModelConfig[],
// ) {
//    for (const config of structureConfigs) {
//       const mutatingOps = config.mutatingOps
//       if (mutatingOps && nativeKey in mutatingOps) {
//          return mutatingOps[nativeKey]
//       }
//       const trackableOps = config.trackableOps
//       if (trackableOps && nativeKey in trackableOps) {
//          return trackableOps[nativeKey]
//       }
//    }
//    return undefined;
// }

//FIX: figure out where to call traceableMethodWrap
function bindNativeMethod(
   proxyProto: ProxyPropertyMap,
   key: string | symbol,
   propertyDescriptor: PropertyDescriptor,
   config: TrackableOpDef | TriggeringOpDef,
   state: ModelState,
   initialTarget: AnyObject,
   ionizedModel: IonizedModel,
) {
   if ('track' in config) {
      propertyDescriptor.value = useTrackableOp(
         initialTarget[key],
         state,
         ionizedModel,
         key,
         config
      )
      Object.defineProperty(proxyProto, key, propertyDescriptor)
   }
   else {
      propertyDescriptor.value = useMutatingOp(
         initialTarget[key],
         state,
         ionizedModel,
         key,
         config
      )
      Object.defineProperty(proxyProto, key,
         propertyDescriptor
      )
   }
}


function useMutatingOp(
   method: Function,
   state: ModelState,
   model: IonizedModel,
   opKey: ProxyKey,
   config: TriggeringOpDef
) {
   const fnName = typeof opKey === 'string' ? 'ionic_' + opKey : 'ionic_mutating_op'
   const { this: useModel, shouldTrigger, triggers: trigger, input = noTransform, output: transformOutput = noTransform, op = method } = config
   const quark = quarkOf(model)

   const o = {
      [fnName](...args: any) {
         const _args = input(args)
         const target = useModel ? model : state.active
         const preop = config.preop?.(target, _args)

         const update = initModelUpdate(quark)

         let output: any;
         try {
            pushUpdate(update)
            output = transformOutput(op.apply(target, _args), model); // perform mutation
         }
         finally {
            popUpdate()
            if (shouldTrigger && !shouldTrigger(preop)) return output;

            // storeSnapshot(quark)

            // recordMutation(quark.asMutable, new Mutation(
            //    model,
            //    opKey,
            //    _args,
            //    output,
            //    preop
            // ))

            trigger?.(new TriggerableModel(quark, update), _args, preop);

            // runSyncEffects()

            return output;
         }

      }
   }
   return o[fnName]
}

export class TriggerableModel {

   constructor(
      private quark: ModelQuark,
      private update: Update
   ) {

   }

   trigger() {
      this.quark.trigger(this.update) //TODO: only trigger if watched? but what about preventing overlapping mutations?
   }

   // triggerProperty(key: PropertyKey) {
   //    const pion = $atomicPion(this.quark, key)
   //    if (pion) {
   //       initModelUpdate(pion, this.update)
   //       pion.trigger()
   //    }
   // }

   triggerOp(op: PropertyKey, entryKey: unknown) {
         $atomicOp(this.quark, op, entryKey)?.trigger(this.update)
   }

   triggerAllOps(op: PropertyKey) {
      const ops = getAtomicOps(this.quark, op)
      if (ops)
         for (const [_, op] of ops) {
            op.trigger(this.update)
         }
   }
}



function initModelUpdate(quark: ModelQuark) {
   const update = initUpdate()
   const state = quark.state

   update.queue(() => {
      state.commitChange()
   })

   update.onCancel(() => {
      state.cancelChange()
   })

   return update;
}

// if (op === '[[get]]') {
//    if (!entryKey) throw new Error('must provide property key to trigger [[get]] op')
//    return function triggerPion(this: { update: Update }) {
//       const pion = $atomicPion(model, entryKey)
//       if (pion) {
//          initModelUpdate(pion, this.update)
//          pion.trigger()
//       }
//    }
// }
// else if (op) {
//    return function triggerOp(this: { update: Update }) {
//       const atomicOp = $atomicOp(model, op, entryKey)
//       if (atomicOp) {
//          initModelUpdate(atomicOp, this.update)
//          atomicOp.trigger()
//       }
//    }
// }
// return function triggerModel(this: { update: Update }) {
//    const quark = quarkOf(model)
//    initModelUpdate(quark, this.update)
//    quark.trigger()
// }


// export function createProxyPropertyMap(meta: AnyObject, target: AnyObject) {
//    // let labelName: string | undefined;

//    // function __DEV__label(label: string) {
//    //    labelName = label;
//    // }

//    let _super: AnyObject | undefined;

//    return new Map([
//       [QUARK as any, () =>
//          meta as any
//       ],
//       ['super', ()=> _super ?? createIonizedModel(target, undefined, MUTABLE, false)]
//       // ['labelName', () =>
//       //    labelName
//       // ],
//       // ['__DEV__label', () =>
//       //    __DEV__label
//       // ],
//    ])
// }

export function __DEV__proxyGetterAssertions(proxy: AnyObject, receiver: AnyObject) {
   if (proxy !== receiver)
      throw new Error('An ionized model cannot serve as a prototype')
   emitSignal()
}


// export function reactiveSetter(
//    model: IonizedModel,
//    initialTarget: AnyObject,
//    key: string | symbol,
//    value: unknown,
//    setOp: (key: ProxyKey, value: any) => void,
//    proxyProto: ProxyPropertyMap
// ) {
//    if (isIonKey(key)) {
//       //TODO:
//    }
//    else {
//       //TODO: new property
//       const ion = proxyProto[key] ?? (proxyProto[key] = createPion(model, initialTarget, key, initialTarget[key]))

//       // set ion
//       if (hasQuark(ion) && 'state' in ion) {
//          const ionQuark = quarkOf(ion) as AtomicIonQuark
//          ionQuark.asPion!.setPionState(quarkOf(model), value)
//          // ionQuark.addModel(quarkOf(model)) 
//          // ion.state = value; //TODO: deionize?
//          return true;
//       }
//       else {
//          return false;
//       }

//    }

//    const quark = quarkOf(model)

//    if (quark.isNewProperty(key)) {
//       quark.registerNewProperty(key)
//       setOp(key, value)
//       return true;
//    }

//    // const oldState = target[key]; //TODO: make sure key is correct for absorbed ions

//    // if (isIon(oldState)) {
//    //    return setAbsorbedIonState(model, key, oldState, value) // we let absorbed ion to decide whether to ionize value or not
//    // }

//    // setOp(key, value)
//    // return true;
// }


// PARTICLE
// tracked op

// WATCHABLE & PARTICLE
// atomic ion
// atomic pion
// model


// export function triggerIonizedModel(
//    model: IonizedModel
// ) {
//    const { asParticle, asWatchedAtom } = quarkOf(model);
//    asParticle?.triggerCompounds()
//    asWatchedAtom?.triggerEffects()
// }








// export function setAbsorbedIonState(model: IonizedModel, key: ProxyKey, ion: Ion, value: unknown) {
//    // const oldState = ion()
//    if (hasQuark(ion) && 'state' in ion) {
//       try {
//          ion.state = value;
//       }
//       catch (err) {
//          if (__DEV__) throw new Error("Absorbed AtomicIon is read only") //TODO: since readonly is only being enforced at the typescript level, make sure typescript prevents mutation of readonly absorbed ions
//          return false;
//       }
//       // const newState = ion.state // get the state that has been maybeIonized

//       // emitAfterSet(model, key, newState, oldState)

//       quarkOf(model).trigger()

//       return true;
//    }
//    if (__DEV__) throw new Error("Absorbed AtomicIon is read only")
//    return false;
// }

// function getMutation(ion: HasQuark<Mutable>) {
//    const quark = quarkOf(ion)
//    return quark.mutation;
// }

