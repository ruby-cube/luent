import { AnyObject } from "@rue/types";
import { isIonizedModel, isIonKey, toRaw } from "./ionize";
import { asTraceable, emitSignal } from "../debug/debug";
import { asAtomicOp, $atomicOp } from "./AtomicOp";
import { storeSnapshot } from "./ionize";
import { IonizedModelQuark } from "./IonizedModelQuark";
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
import { initUpdate, isLazyUpdate, updateStack } from "../effect-cycle/ReactivitySystem";
import { AtomicIonQuark, createAtomicIon, ModelState, NULL, PionState, setState } from "../ion/AtomicIon";
import { isTracking, trackParticle } from "../compound/Compound";

export function $atomicPion(
   model: IonizedModel,
   key: PropertyKey,
) {
   throw Error('this should be replaced')
}

// // /** INTERNAL */
export type IonizedModel = {
   [QUARK]: Watchable & IonizedModelQuark
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

// type BeforeSetCallback = (ionizedModel: IonizedModel, meta: IonizedModelQuark, key: ProxyKey, oldValue: any) => void
// type AfterSetCallback = (ionizedModel: IonizedModel, meta: IonizedModelQuark, key: ProxyKey, newValue: any, oldValue: any) => void


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
   state: ModelState,
   ionized: IonizedModel,
   opKey: ProxyKey,
   config: TrackableOpDef,
) {
   const { op, track, input = noTransform, output = noTransform, this: transformThis = noTransform } = config

   const fn = op ?? state.current[opKey]

   return function trackableOp(...args: any[]) {
      if (__DEV__) emitSignal();
      const _args = input(args);
      track(ionized, opKey, _args)
      return output(fn.call(transformThis(state.getActiveTarget(), _args), ..._args), ionized)
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


function initializeState(initialData: AnyObject) {
   // - turn absorbed ions into getters
   // - delete ion keys
   for (const key in initialData) {
      if (isIonKey(key)) {
         const value = initialData[key]
         if (isIon(value)) {
            const stateKey = key.slice(1)
            Object.defineProperty(initialData, stateKey, {
               enumerable: true,
               get: value
            })
            delete initialData[key];
         }
      }
      else {
         const value = initialData[key]
         if (isIon(value)) {
            Object.defineProperty(initialData, key, {
               enumerable: true,
               get: value
            })
         }
      }
   }
   return initialData;
}

const GET = 0 as const;
const SET = 1 as const;

type ProxyKey = string | symbol

//TODO:
// - I really need to think through if property changes should trigger the whole model
// - adding and deleting properties
export function createIonizedModel(
   initialTarget: object,
   inertSchema: AnyObject | undefined,
) {

   const state = {
      current: initializeState(initialTarget),
      pending: NULL as typeof NULL | AnyObject,
      getActiveTarget() {
         return isLazyUpdate() && this.pending !== NULL ? this.pending : this.current
      }
   }

   console.log('model state', state.current)

   const proxyProto = Object.create(null) // state keys and ion access keys
   const initializedProperties = { [QUARK]: true } as AnyObject

   function initializeProperty(proxyProto: AnyObject, key: ProxyKey, op: typeof GET | typeof SET = GET): boolean {
      let target = initialTarget

      const _isIonKey = isIonKey(key);
      let stateKey = _isIonKey ? key in target ? key : key.slice(1) : key;
      let ionKey = _isIonKey ? key : undefined;

      initializedProperties[stateKey] = true;

      console.log('stateKey', stateKey)
      console.log('ionKey', ionKey)
      console.log('yes object', target)
      console.log(Object.getPrototypeOf(target).constructor)
      let isProto = false; // prototypes do not hold any state, only getters and methods
      do {
         const propertyDescriptor = Object.getOwnPropertyDescriptor(target, stateKey)
         if (propertyDescriptor) {
            if (propertyDescriptor.get || propertyDescriptor.set) {
               //TODO: check if there's a special config for tracking and triggering
               // else no special treatment
               Object.defineProperty(proxyProto, stateKey, propertyDescriptor)
               return true;
            }
            else {
               const value = propertyDescriptor.value
               if (isIon(value)) {
                  const $key = ionKey ?? toIonKey(key, initialTarget)
                  if ($key) initializedProperties[$key] = true;
                  initializeAbsorbedIon(
                     proxyProto,
                     stateKey,
                     value,
                     $key
                  )
                  return true;
               }
               else if (isFunction(value)) {
                  if (op === SET) {
                     // TODO: if setting method before it's initialized
                     return propertyDescriptor.writable ?? false;
                  }
                  const methodDef = getIonizedMethodDef(initialTarget, key)
                  if (methodDef) { //NOTE: this block must be above target[_key] for Array.from(set) to work
                     bindNativeMethod(
                        methodDef,
                        key,
                        state,
                        ionizedModel,
                        propertyDescriptor,
                        proxyProto,
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
                  if (isTracking()) {
                     const $key = ionKey ?? toIonKey(key, initialTarget)
                     if ($key) initializedProperties[$key] = true;
                     initializePion(
                        proxyProto,
                        stateKey,
                        $key,
                        state,
                        modelQuark,
                        propertyDescriptor
                     )
                     return true;
                  }
                  else {
                     let _value = propertyDescriptor.value;
                     Object.defineProperty(proxyProto, stateKey, {
                        enumerable: propertyDescriptor.enumerable,
                        configurable: propertyDescriptor.configurable,
                        get() {
                           if (isTracking()) {
                              const $key = ionKey ?? toIonKey(key, initialTarget)
                              if ($key) initializedProperties[$key] = true;
                              const pion = initializePion(
                                 proxyProto,
                                 stateKey,
                                 $key,
                                 state,
                                 modelQuark,
                                 propertyDescriptor
                              )
                              return pion()
                           }
                           return _value
                        },
                        set(value) {
                           _value = value;
                        }
                     })
                     const $key = ionKey ?? toIonKey(key, initialTarget)
                     if ($key)
                        Object.defineProperty(proxyProto, $key, {
                           enumerable: propertyDescriptor.enumerable,
                           configurable: propertyDescriptor.configurable,
                           get() {
                              const $key = ionKey ?? toIonKey(key, initialTarget)
                              if ($key) initializedProperties[$key] = true;
                              return initializePion(
                                 proxyProto,
                                 stateKey,
                                 $key,
                                 state,
                                 modelQuark,
                                 propertyDescriptor
                              )
                           },
                           set(value) {
                              _value = value;
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
      if (op === SET) {
         //TODO: add new property
         return true;
      }
      return false;
   }

   const ionizedModel = new Proxy(proxyProto, {

      get(proxyProto, key, receiver) {
         __DEV__proxyGetterAssertions(ionizedModel, receiver)
         if (key in initializedProperties) {
            return proxyProto[key]
         }
         initializeProperty(
            proxyProto,
            key
         )
         return proxyProto[key]
      },

      set(proxyProto, key, value) {
         if (key in initializedProperties) {
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
         // getActiveTracker()?.track(asAtomicOp(ionizedModel, '[[in]]', key)) //TODO: trigger [[in]] when property is added or property is deleted
         //TODO: need to figure out how to deal with ion access keys
         return key in proxyProto || (key in initialTarget)
      },

      getOwnPropertyDescriptor(target, key) {
         //TODO: track
         return Reflect.getOwnPropertyDescriptor(target, key)
      },

      defineProperty(target: AnyObject, key, attributes) {
         const success = Reflect.defineProperty(target, key, attributes)
         if (!success) return false;
         if (!(key in target)) {
            triggerKeysChange(ionizedModel, key)
         }
         else if (target[key] !== attributes.value) {
            $atomicPion(ionizedModel, key)?.trigger()
         }
         modelQuark.trigger()
         //TODO: record mutation?
         return true;
      },

      deleteProperty(target: AnyObject, key) {
         const success = delete target[key]
         if (!success) return false;
         if (target[key] !== undefined) {
            $atomicPion(ionizedModel, key)?.trigger()
         }
         if (key in target) {
            triggerKeysChange(ionizedModel, key)
         }
         modelQuark.trigger()
         //TODO: record mutation?
         return true;
      },

      ownKeys() {
         if (isTracking())
            trackParticle(asAtomicOp(ionizedModel, INTERNAL_OP, 'ownKeys')) //TODO: trigger when any new property is added or deleted
         return Reflect.ownKeys(state.getActiveTarget())
      },

      setPrototypeOf(target, proto) {
         debug.warn("[DISALLOWED] Cannot setPrototypeOf ionized model")
         return false
      },

      isExtensible(target) {
         trackParticle(asAtomicOp(ionizedModel, INTERNAL_OP, 'isExtensible'))
         return Reflect.isExtensible(initialTarget)
      },

      preventExtensions(target) {
         $atomicOp(ionizedModel, INTERNAL_OP, 'isExtensible')?.trigger()
         return Reflect.preventExtensions(initialTarget)
      },

   }) as unknown as IonizedModel

   const modelQuark = new IonizedModelQuark(ionizedModel, initialTarget, state)
   proxyProto[QUARK] = modelQuark

   // const setOp = useMutatingOp(initialTarget, ionizedModel, '[[set]]', triggeringPropertySetOp)


   registerIonizedModel(ionizedModel, initialTarget)
   // initializeSnapshots(target)
   return ionizedModel
}

export type ProxyPropertyMap = Record<ProxyKey, (() => any) | undefined>

function triggerKeysChange(model: IonizedModel, key: ProxyKey) {
   $atomicOp(model, INTERNAL_OP, 'ownKeys')?.trigger()
   $atomicOp(model, KEY_IN_OP, key)?.trigger()
   //QUESTION: shoule this trigger the whole model? I don't think so?
}

// function initialAccess(
//    target: AnyObject,
//    // marks: MarkMap | ShallowMark | undefined,
//    ionizedModel: IonizedModel,
//    quark: IonizedModelQuark,
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
      set: hasQuark(value) ? setState.bind(quarkOf(value) as AtomicIonQuark) : undefined
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

function toIonKey(key: ProxyKey, initialTarget: AnyObject) {
   if (typeof key !== 'string') return;
   const ionKey = '$' + key
   if (ionKey in initialTarget) return;
   return ionKey;
}

function initializeProperty(
   proxyProto: AnyObject,
   key: string | symbol,
   initialTarget: AnyObject,
   state: ModelState,
   quark: IonizedModelQuark,
) {




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

}

function initializePion(
   proxyProto: ProxyPropertyMap,
   key: ProxyKey,
   ionKey: string | undefined,
   state: ModelState,
   quark: IonizedModelQuark,
   propertyDescriptor: PropertyDescriptor
) {
   console.log('&&& initializePion')
   console.log('&&& key', key)
   console.log('&&& ionKey', ionKey)
   const ion = createAtomicIon(new PionState(state, key, quark.clone), undefined, true)
   Object.defineProperty(proxyProto, key, {
      enumerable: propertyDescriptor.enumerable,
      configurable: propertyDescriptor.configurable,
      get: ion,
      set: setState.bind(quarkOf(ion))
   })
   if (ionKey) {
      Object.defineProperty(proxyProto, ionKey, {
         enumerable: false,
         configurable: propertyDescriptor.configurable,
         value: ion,
         writable: false
      })
   }
   return ion;
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
//    if (__DEV__) console.warn('Invalid Property Key initialization: Property keys prefixed with a single dollar sign ($) are reserved for ions.\n' + asTraceable(proxy).origin)
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



export function accessMethod(
   target: AnyObject,
   proxy: IonizedModel,
   receiver: AnyObject,
   key: ProxyKey,
   boundMethodMap: Map<ProxyKey, Function>,
   method?: Function
) {
   return getBoundMethod(
      proxy,
      key,
      boundMethodMap,
      method
   )
}

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
   config: TrackableOpDef | TriggeringOpDef,
   key: string | symbol,
   state: ModelState,
   ionizedModel: IonizedModel,
   propertyDescriptor: PropertyDescriptor,
   proxyProto: ProxyPropertyMap,
) {
   if ('track' in config) {
      Object.defineProperty(proxyProto, key, {
         ...propertyDescriptor,
         value: useTrackableOp(
            state,
            ionizedModel,
            key,
            config
         )
      })
   }
   else {
      // __DEV__ ? traceableMethodWrap('Ionized Method', ionizedModel, nativeKey, createOp(target, ionizedModel, quark, getPreopData))
      // : 
      // createOp(target, ionizedModel, quark, getPreopData)
      Object.defineProperty(proxyProto, key, {
         ...propertyDescriptor,
         value: useMutatingOp(
            state,
            ionizedModel,
            key,
            config
         )
      })
   }
}


function useMutatingOp(
   state: ModelState,
   model: IonizedModel,
   opKey: ProxyKey,
   config: TriggeringOpDef
) {
   const fnName = typeof opKey === 'string' ? 'ionic_' + opKey : 'ionic_mutating_op'
   const { shouldTrigger, triggers: getTriggers, input = noTransform, output: transformOutput = noTransform, op = state.current[opKey] } = config
   const quark = quarkOf(model)

   const o = {
      [fnName](...args: any) {
         const _args = input(args)
         const target = state.getActiveTarget()
         const preop = config.preop?.(target, _args)

         const output = transformOutput(op.apply(target, _args), model); // perform mutation

         if (shouldTrigger && !shouldTrigger(preop)) return output;

         storeSnapshot(quark)

         const update = initUpdate()

         recordMutation(quark.asMutable, new Mutation(
            model,
            opKey,
            _args,
            output,
            preop
         ))

         const triggers = getTriggers(model, _args, preop);

         const u = { update }
         for (const trigger of triggers) {
            trigger.apply(u)
         }

         // runSyncEffects()

         return output;
      }
   }
   return o[fnName]
}


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


export function reactiveSetter(
   model: IonizedModel,
   initialTarget: AnyObject,
   key: string | symbol,
   value: unknown,
   setOp: (key: ProxyKey, value: any) => void,
   proxyProto: ProxyPropertyMap
) {
   if (isIonKey(key)) {
      //TODO:
   }
   else {
      //TODO: new property
      const ion = proxyProto[key] ?? (proxyProto[key] = createPion(model, initialTarget, key, initialTarget[key]))

      // set ion
      if (hasQuark(ion) && 'state' in ion) {
         const ionQuark = quarkOf(ion) as AtomicIonQuark
         ionQuark.asPion!.setPionState(quarkOf(model), value)
         // ionQuark.addModel(quarkOf(model)) 
         // ion.state = value; //TODO: deionize?
         return true;
      }
      else {
         return false;
      }

   }

   const quark = quarkOf(model)

   if (quark.isNewProperty(key)) {
      quark.registerNewProperty(key)
      setOp(key, value)
      return true;
   }

   // const oldState = target[key]; //TODO: make sure key is correct for absorbed ions

   // if (isIon(oldState)) {
   //    return setAbsorbedIonState(model, key, oldState, value) // we let absorbed ion to decide whether to ionize value or not
   // }

   // setOp(key, value)
   // return true;
}


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

