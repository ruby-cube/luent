import { AnyObject } from "@rue/types";
import { InertMark, Ionized, isIonicProxy, isIonKey, toRaw } from "./ionize";
import { __DEV__asTraceable, emitSignal } from "../debug/debug";
import { getAtomicOp, getTrackedOps } from "./TrackableOp";
import { ModelQuark } from "./ModelQuark";
import { debug, isFunction, isObject, noop } from "@rue/utils";
import { Ion, isIon, MutableIon } from "../ion/Ion";
import { __DEV__trace } from "../debug/debug";
import { QUARK, quarkOf } from "../abstract/Quark";
import { Atom, trigger } from "../reactivity/Atom";
import { getIonizedMemberDef, MutatingOpDef, TrackableOpDef, MemberType, initModelUpdate, useIonicOp, trackOp } from "./IonicMethods";
import { inert, isInert } from "./notes/inert";
import { QuarkyAtomicIon, AtomicIonQuark, createAtomicIon } from "../ion/AtomicIon";
import { inTrackedScope } from "../reactivity/Compound";
import { Update } from "../reactivity/Update";
import { PionState } from "../reactivity/x_LazyState";
import { MutableEntity } from "../abstract/Mutable";
import { ModelState } from "../reactivity/State";

// export function $atomicPion(
//    modelQuark: ModelQuark,
//    key: PropertyKey,
// ) {
//    const pion = modelQuark.pions[key]
//    if (pion instanceof Map) throw new Error(`${key.toString()} is not a pion`)
//    return pion;
// }

// // /** INTERNAL */
export type IonicProxy = {
   [QUARK]: Atom & ModelQuark
} & Capsule & MutableEntity & AnyObject

// for inert properties use absorbed neutrons
// const frog = Ionic({
//    name: Neutron('kermit'),
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
//    const proto = Object.getPrototypeOf(target); // TODO: custom get data structure for factory functions
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
//    beforeSet?: BeforeSetCallback; // TODO:
//    afterSet?: AfterSetCallback;
//    isEntryKey?: (model: AnyObject, key: ProxyKey) => boolean
//    // getStructureKeys: (model: AnyObject) => any[]
// }

// type BeforeSetCallback = (ionizedModel: IonicProxy, meta: ModelQuark, key: ProxyKey, oldValue: any) => void
// type AfterSetCallback = (ionizedModel: IonicProxy, meta: ModelQuark, key: ProxyKey, newValue: any, oldValue: any) => void


// type CreateTrackableOp = (
//    target: AnyObject,
//    model: IonicProxy,
//    op: ProxyKey,
//    transformInput?: (args: any[]) => any[],
//    transformTarget?: (target: AnyObject, args: any[]) => AnyObject,
//    transformOutput?: (output: any) => any
// ) => (...args: any[]) => any


// type MutatingOpConfig = {
//    createOp: (state: ModelState, ionizedModel: IonicProxy, meta: any, getPreopData: GetPreopData | undefined) => (...args: any[]) => any
//    preop?: GetPreopData
//    revert?: Revert
// }

export type GetPreopData = (target: AnyObject, args?: any[]) => any;
// type Revert = (model: AnyObject, data: { output: any, preopData: any, args: any[] }) => void




// function asTrackable(tracked: [IonicProxy] | [IonicProxy, ProxyKey, any[]]) {
//    const [model, op, input] = tracked;
//    if (op) {
//       return asAtomicOp(model, op, input![0]) // TODO: atomicOps that have more than one 'entry key'
//    } else {
//       return quarkOf(model)
//    }
// }







// a `trackable op` is a method like 'filter' that tracks the entire ionic model as a watch subject rather than a specific entry or property
// and also receives a callback that receives property values of the model
// export function useTrackableOpWithCallback(
//    model: IonicProxy,
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

// function emitAfterSet(model: IonicProxy, key: ProxyKey, newValue: any, oldValue: any) {
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


// export function isNonTrackable(key: ProxyKey, structureConfigs: CustomIonizedModelConfig[]) { // TODO: ?
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
//    // TODO: should we do a structured clone instead using Object.getGetOwnProperties?
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

export type ProxyKey = string | symbol
type CloneFn = (entity: any) => any
function getCloner(entity: object): CloneFn {
   // TODO: get cloner from data structure configs
   if (entity instanceof Array) return (entity: any[]) => {
      return Object.assign([], entity)
   }
   if (entity instanceof Date) return (entity: Date) => {
      return Object.assign(new Date(entity), entity)
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

export function isIntegerKey(key: unknown) {
   if (typeof key === 'symbol') return false;
   const keyAsNumber = Number(key);
   if (isNaN(keyAsNumber)) return false;
   if (Number.isInteger(keyAsNumber)) return true
}

export type MarkMap = { [key: PropertyKey]: InertMark | MarkMap }

// export type IonizeOptions = { mark?: MarkMap }



export type IonizeOptions = {
   nested?: any,
   '@set'?: { [key: string]: () => void },
   '@get'?: { [key: string]: () => void },
}

export const EACH = Symbol('each')


// TODO:
// - I really need to think through if property changes should trigger the whole model
// - adding and deleting properties
export function createIonicProxy(
   initialTarget: AnyObject,
   options: IonizeOptions,
) {

   const { clone, isAbsorbedIon } = getIonizedConfig(initialTarget)

   const state = new ModelState(initialTarget, clone)

   const proxyProto = Object.create(null) // state keys and ion access keys
   proxyProto.constructor = initialTarget.constructor

   function initializeProperty(proxyProto: AnyObject, key: ProxyKey, op: typeof GET | typeof SET = GET, value: unknown = undefined): boolean {
      let target = initialTarget

      if (key === 'setTime') console.log('methodDef')

      // const ionKey = toIonKey(key, target);
      // const stateKey = ionKey ? ionKey.slice(1) : key;

      let originalKey = key in target ? key : undefined
      if (!originalKey) {
         if (op === SET) {
            if (isAbsorbedIon(value, key)) {
               // TODO: absorbed ion
               return true;
            }
            else if (isFunction(value)) {
               // TODO: method
               return true;
            }
            else {
               createPion(proxyProto, key, state, modelQuark, { configurable: true, enumerable: true }, options?.mark?.[isIntegerKey(key) ? EACH : key])
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
               const opDef = getIonizedMemberDef(initialTarget, originalKey)
               if (opDef) {
                  propertyDescriptor.get = 'get' in opDef && propertyDescriptor.get ? useIonicOp[MemberType.TRACKABLE](propertyDescriptor.get, opDef.get?.privateState ? state : { get() { return ionizedModel } }, ionizedModel, '[[get]]', opDef.get!) : propertyDescriptor.get?.bind(ionizedModel)
                  propertyDescriptor.set = 'set' in opDef && propertyDescriptor.set ? useIonicOp[MemberType.MUTATING](propertyDescriptor.set, opDef.set?.privateState ? state : { get() { return ionizedModel } }, ionizedModel, '[[set]]', opDef.set!) : propertyDescriptor.set?.bind(ionizedModel)
                  Object.defineProperty(proxyProto, key, propertyDescriptor)
                  return !!propertyDescriptor.set;
               }
               propertyDescriptor.get = propertyDescriptor.get?.bind(ionizedModel)
               propertyDescriptor.set = propertyDescriptor.set?.bind(ionizedModel)
               Object.defineProperty(proxyProto, key, propertyDescriptor)
               return true;
            }
            else {
               const value = propertyDescriptor.value
               if (isAbsorbedIon(value, key)) {
                  initializeAbsorbedIon(
                     proxyProto,
                     key,
                     value
                  )
                  return true;
               }
               else if (isFunction(value)) {
                  if (op === SET) {
                     // TODO: if setting method before it's initialized
                     return propertyDescriptor.writable ?? false;
                  }
                  const methodDef = getIonizedMemberDef(initialTarget, key) as TrackableOpDef | MutatingOpDef
                  if (key === 'setTime') console.log('methodDef', methodDef)
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
                  if (inTrackedScope()) {
                     createPion(
                        proxyProto,
                        key,
                        state,
                        modelQuark,
                        propertyDescriptor,
                        options?.mark?.[isIntegerKey(key) ? EACH : key]
                     )
                     return true;
                  }
                  else {
                     // State access, no tracking
                     let _value = propertyDescriptor.value;
                     Object.defineProperty(proxyProto, key, {
                        configurable: true,
                        enumerable: propertyDescriptor.enumerable,
                        get() {
                           if (inTrackedScope()) {
                              const pion = createPion(
                                 proxyProto,
                                 key,
                                 state,
                                 modelQuark,
                                 propertyDescriptor,
                                 options?.mark?.[isIntegerKey(key) ? EACH : key]
                              )
                              return pion();
                           }
                           return maybeIonize(_value, options?.mark?.[isIntegerKey(key) ? EACH : key])
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

   const ionizedModel = new Proxy(initialTarget, {

      get(target, key, receiver) {
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

      set(target, key, value) {
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

      has(target, key) {
         if (key === QUARK) return true;
         trackOp(ionizedModel, '[[in]]', key)
         // TODO: need to figure out how to deal with ion access keys
         return key in proxyProto || (key in initialTarget)
      },

      getOwnPropertyDescriptor(target, key) {
         // TODO: track
         return Object.getOwnPropertyDescriptor(target, key) // TODO: adjust key for absorbed ion
      },

      defineProperty(target: AnyObject, key, attributes) {
         const success = Reflect.defineProperty(state.get(), key, attributes)
         if (!success) return false;
         const update = initModelUpdate(modelQuark)
         if (!(key in target)) {
            triggerKeysChange(modelQuark, key, update)
         }
         else if (target[key] !== attributes.value) {
            getPionQuark(target, key)?.trigger(update)
         }
         trigger(modelQuark, update)
         // TODO: record mutation?
         return true;
      },

      deleteProperty(target: AnyObject, key) {
         const pionQuark = getPionQuark(proxyProto, key)
         const success = Reflect.deleteProperty(state.get(), key)
         if (!success) return false;

         const update = initModelUpdate(modelQuark)

         pionQuark?.trigger(update)
         if (key in proxyProto) {
            triggerKeysChange(modelQuark, key, update)
         }
         trigger(modelQuark, update)
         // TODO: record mutation?
         return true;
      },

      ownKeys() {
         trackOp(ionizedModel, INTERNAL_OP, ['ownKeys']) // TODO: trigger when any new property is added or deleted
         return Reflect.ownKeys(state.get())
      },

      getPrototypeOf(target) {
         return Reflect.getPrototypeOf(target)
      },

      setPrototypeOf(target, proto) {
         debug.warn("[DISALLOWED] Cannot setPrototypeOf ionized model")
         return false
      },

      isExtensible(target) {
         trackOp(ionizedModel, INTERNAL_OP, 'isExtensible')
         return Reflect.isExtensible(state.get())
      },

      preventExtensions(target) {
         const update = initModelUpdate(modelQuark)
         getAtomicOp(modelQuark, INTERNAL_OP, 'isExtensible')?.trigger(update)
         return Reflect.preventExtensions(state.get())
      },

   }) as unknown as IonicProxy

   const modelQuark = new ModelQuark(ionizedModel, initialTarget, state, clone, proxyProto)
   proxyProto[QUARK] = modelQuark

   // const setOp = useMutatingOp(initialTarget, ionizedModel, '[[set]]', triggeringPropertySetOp)


   registerIonizedModel(ionizedModel, initialTarget)
   // initializeSnapshots(target)
   return ionizedModel
}

export type ProxyPropertyMap = Record<ProxyKey, (() => any) | undefined>

function triggerKeysChange(quark: ModelQuark, key: ProxyKey, update: Update) {
   getAtomicOp(quark, INTERNAL_OP, 'ownKeys')?.trigger(update)
   getAtomicOp(quark, KEY_IN_OP, key)?.trigger(update)
   //QUESTION: shoule this trigger the whole model? I don't think so?
}

// function initialAccess(
//    target: AnyObject,
//    // marks: MarkMap | ShallowMark | undefined,
//    ionizedModel: IonicProxy,
//    quark: ModelQuark,
//    key: string | symbol,
//    proxyProto: ProxyPropertyMap,
// ) {
//    // if (methods && key in methods) {
//    //    return bindMethod(methods[key], key, ionizedModel, proxyProto)
//    // }
//    const nativeMethodDef = getIonizedMemberDef(target, key)
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

function isInertMark(mark: InertMark | MarkMap | undefined): mark is InertMark {
   return mark === inert
}

export function maybeIonize<T>(value: T, mark: InertMark | MarkMap | undefined): T extends AnyObject ? Ionized<T> : T {
   if (isIonicProxy(value) || !isObject(value) || isInert(value) || isInertMark(mark)) {
      if (mark === inert) inert(value);
      return value as T extends AnyObject ? Ionized<T> : T;
   }
   return (ionizedModels.get(value) ?? createIonicProxy(value, { mark })) as T extends AnyObject ? Ionized<T> : T
}


function initializeAbsorbedIon(proxyProto: AnyObject, key: ProxyKey, value: Ion) {
   // absorbed ion
   Object.defineProperty(proxyProto, key, {
      enumerable: true,
      get: value,
      set: 'value' in value ? Object.getOwnPropertyDescriptor(value, 'value')?.set : undefined
   })
   // if (ionKey) {
   //    // ion access
   //    Object.defineProperty(proxyProto, ionKey, {
   //       enumerable: false,
   //       value
   //    })
   // }
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


type ExposeIons<T extends AnyObject> = { [K in keyof T]: T[K] extends Function ? undefined : MutableIon<T[K]> } // TODO: Ion if readonly

export function $from<T extends AnyObject>(value: T): ExposeIons<T> {
   if (!isIonicProxy(value)) return value as ExposeIons<T>
   const modelQuark = quarkOf(value);
   return modelQuark.pions ?? (modelQuark.pions = createPionsProxy(modelQuark.proxyProto, value))
}

function createPionsProxy(proxyProto: AnyObject, model: IonicProxy) {
   return new Proxy(proxyProto, {
      get(target, key) {
         return getPion(target, key) ?? (Ion(() => model[key]), model[key], getPion(target, key)) //NOTE: Ion(() => model[key]) is a cheat to provide the property access with a tracker so that a pion is created. We need a better way...
      }
   })
}


function getPion(proxyProto: ProxyPropertyMap, key: ProxyKey) {
   const getter = Object.getOwnPropertyDescriptor(proxyProto, key)?.get
   if (!getter) return undefined;
   if (QUARK in getter) return getter as QuarkyAtomicIon;
   return undefined
}

function getPionQuark(proxyProto: ProxyPropertyMap, key: ProxyKey) {
   const pion = getPion(proxyProto, key)
   if (pion) return quarkOf(pion)
   return undefined;
}

// /**
//  * Case: ion access, ion already initialized (must retreive ion)
//  * Case: ion access, ion not initialized
//  * Case: state access, ion not initialized (initialize state access only)
//  * 
//  * @param proxyProto 
//  * @param key 
//  * @param ionKey 
//  * @param state 
//  * @param quark 
//  * @param propertyDescriptor 
//  * @returns 
//  */
// function initializePion(
//    proxyProto: ProxyPropertyMap,
//    stateKey: ProxyKey,
//    state: ModelState,
//    quark: ModelQuark,
//    propertyDescriptor: PropertyDescriptor,
//    mark: InertMark | MarkMap | undefined
// ) {
//    // if (ionKey) {
//    //    return initializePionAccess(proxyProto, stateKey, ionKey, state, quark, propertyDescriptor, mark)
//    // } else {
//       return createPion(proxyProto, stateKey, state, quark, propertyDescriptor, mark)
//    // }
// }


// function initializePionAccess(
//    proxyProto: ProxyPropertyMap,
//    key: ProxyKey,
//    state: ModelState,
//    quark: ModelQuark,
//    propertyDescriptor: PropertyDescriptor,
//    mark: InertMark | MarkMap | undefined
// ) {
//    const ion = getPion(proxyProto, key) ?? createPion(proxyProto, key, state, quark, propertyDescriptor, mark)

//    return ion;
// }

function createPion(
   proxyProto: ProxyPropertyMap,
   key: ProxyKey,
   state: ModelState,
   modelQuark: ModelQuark,
   propertyDescriptor: PropertyDescriptor,
   mark: InertMark | MarkMap | undefined
) {
   const propDef = getIonizedMemberDef(state.get(), key)
   const ion = createAtomicIon(new AtomicIonQuark(new PionState(state, key), modelQuark, propDef?.track, propDef?.trigger), true, mark)
   Object.defineProperty(proxyProto, key, {
      enumerable: propertyDescriptor.enumerable,
      configurable: propertyDescriptor.configurable,
      get: ion,
      set: Object.getOwnPropertyDescriptor(ion, 'value')!.set //NOTE: equivalent performance to storing setter on quark
   })
   return ion
}

// export function initialPropertyAccess(
//    target: AnyObject,
//    ionizedModel: IonicProxy,
//    // structureConfigs: CustomIonizedModelConfig[],
//    key: string | symbol,
//    value: any,
//    proxyProto: ProxyPropertyMap,
//    // marks: MarkMap | ShallowMark | undefined,
// ) {

//    // if (isNonTrackable(key)) { //QUESTION: is this worth it? // TODO: include non-writable properties
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
function bindMethod(proxyProto: ProxyPropertyMap, key: ProxyKey, method: Function, propertyDescriptor: PropertyDescriptor, ionizedModel: IonicProxy) {
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
//    proxy: IonicProxy,
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
      // TODO: decide whether to use Reflect.get or target[key], or when to use which
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
//    ionizedModel: IonicProxy,
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

// function createPion(ionizedModel: IonicProxy, target: AnyObject, key: ProxyKey, value: unknown) {
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


const ionizedModels: WeakMap<AnyObject, IonicProxy> = new WeakMap()

function registerIonizedModel(ionized: IonicProxy, target: AnyObject) {
   ionizedModels.set(target, ionized)
}

export function getIonizedModel(value: unknown) {
   return ionizedModels.get(value as AnyObject)
}






export function isMethod(value: any): value is Function {
   return value instanceof Function && !isIon(value)
}



// export function accessMethod(
//    target: AnyObject,
//    proxy: IonicProxy,
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
//    proxy: IonicProxy,
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
   config: TrackableOpDef | MutatingOpDef,
   state: ModelState,
   initialTarget: AnyObject,
   ionizedModel: IonicProxy,
) {
   propertyDescriptor.value = useIonicOp[config.type](
      initialTarget[key],
      config.privateState ? state : { get() { return ionizedModel } },
      ionizedModel,
      key,
      config
   )
   Object.defineProperty(proxyProto, key, propertyDescriptor)
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
//       const atomicOp = getAtomicOp(model, op, entryKey)
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
//       ['super', ()=> _super ?? createIonicProxy(target, undefined, MUTABLE, false)]
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
//    model: IonicProxy,
//    initialTarget: AnyObject,
//    key: string | symbol,
//    value: unknown,
//    setOp: (key: ProxyKey, value: any) => void,
//    proxyProto: ProxyPropertyMap
// ) {
//    if (isIonKey(key)) {
//       // TODO:
//    }
//    else {
//       // TODO: new property
//       const ion = proxyProto[key] ?? (proxyProto[key] = createPion(model, initialTarget, key, initialTarget[key]))

//       // set ion
//       if (hasQuark(ion) && 'value' in ion) {
//          const ionQuark = quarkOf(ion) as AtomicIonQuark
//          ionQuark.asPion!.setPionState(quarkOf(model), value)
//          // ionQuark.addModel(quarkOf(model)) 
//          // ion.state = value; // TODO: deionize?
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

//    // const oldState = target[key]; // TODO: make sure key is correct for absorbed ions

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
//    model: IonicProxy
// ) {
//    const { asParticle, asTrackedAtom } = quarkOf(model);
//    asParticle?.triggerCompounds()
//    asTrackedAtom?.triggerEffects()
// }








// export function setAbsorbedIonState(model: IonicProxy, key: ProxyKey, ion: Ion, value: unknown) {
//    // const oldState = ion()
//    if (hasQuark(ion) && 'value' in ion) {
//       try {
//          ion.state = value;
//       }
//       catch (err) {
//          if (__DEV__) throw new Error("Absorbed AtomicIon is read only") // TODO: since readonly is only being enforced at the typescript level, make sure typescript prevents mutation of readonly absorbed ions
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

