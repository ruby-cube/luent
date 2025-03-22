import { AnyObject } from "@rue/types";
import { ionize, registerIonizedModel, toRaw } from "./ionize";
import { asTraceable, emitSignal } from "../debug/debug";
import { asAtomicOp, getAtomicOp } from "./AtomicOp";
import { storeSnapshot } from "./ionize";
import { IonizedModelQuark } from "./IonizedModelQuark";
import { debug, isFunction, isObject, noop } from "@rue/utils";
import { Ion, isIon } from "../ion/ion";
import { __DEV__trace, __DEV__traceMethodCall, traceableMethodWrap } from "../debug/debug";
import { HasQuark, hasQuark, QUARK, quarkOf } from "../Quark";
import { getActiveTracker } from "../ionic/IonicCompound";
import { Capsule } from "../capsule/Capsule";
import { Mutable, MutableEntity, MutableMorph, Mutation, recordMutation } from "../Mutable";
import { asPion, asPionQuark, getAtomicPion } from "./Pion";
import { ParticleMorph } from "../compound/Particle";
import { CompoundMorph } from "../compound/Compound";
import { Watchable } from "../watch/Watched";
import { IonizedCompound } from "./IonizedCompound";
import { runSyncEffects } from "../effect-cycle/SyncEffects";

// // /** INTERNAL */
export type IonizedModel = {
   [QUARK]: Watchable & ParticleMorph & CompoundMorph<IonizedCompound> & IonizedModelQuark
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


export const OVERRIDE = true;


//API
export function defineIonizedStructure(structureKey: any, config: CustomIonizedModelConfig, override?: boolean) {
   const existing = ionicStructureMap.get(structureKey)
   if (existing && !override) {
      console.warn(`Ionic structure already defined for the structure key, ${structureKey.toString()}. To override, pass in override parameter as true.`)
      return;
   }
   config.structure = structureKey;
   // const { isEntryKey } = config
   // if (isEntryKey) {
   //    registerEntryKeyValidator(isEntryKey)
   // }

   ionicStructureMap.set(structureKey, config)
}





export function getStructureConfigs(target: AnyObject) {
   return getStructureConfig(target, [])
}

function getStructureConfig(target: AnyObject, configs: any[]) {
   const proto = Object.getPrototypeOf(target); //TODO: custom get data structure for factory functions
   if (!proto) return configs;
   const constructor = proto.constructor;
   if (!isCustomIonicStructure(constructor)) {
      return getStructureConfig(proto, configs)
   }
   const config = ionicStructureMap.get(constructor)
   if (config) configs.push(config);
   return getStructureConfig(proto, configs)
}

export const TRACK_ENTRY = 1 as const
export const TRACK_MODEL = 2 as const
export const TRACK_MODEL_WITH_CALLBACK = 3 as const



export type CustomIonizedModelConfig = {
   structure?: any;
   nontrackableKeys?: { [key: PropertyKey]: boolean };
   trackableOps?: { [key: PropertyKey]: CreateTrackableOp }
   mutatingOps?: { [key: PropertyKey]: MutatingOpConfig };
   beforeSet?: BeforeSetCallback; //TODO:
   afterSet?: AfterSetCallback;
   isEntryKey?: (model: AnyObject, key: PropertyKey) => boolean
   // getStructureKeys: (model: AnyObject) => any[]
}

type BeforeSetCallback = (ionizedModel: IonizedModel, meta: IonizedModelQuark, key: PropertyKey, oldValue: any) => void
type AfterSetCallback = (ionizedModel: IonizedModel, meta: IonizedModelQuark, key: PropertyKey, newValue: any, oldValue: any) => void


type CreateTrackableOp = (
   target: AnyObject,
   model: IonizedModel,
   op: PropertyKey,
   transformArgs?: (args: any[]) => any[],
   transformTarget?: (target: AnyObject, args: any[]) => AnyObject,
   transformReturn?: (result: any) => any
) => (...args: any[]) => any


type MutatingOpConfig = {
   createOp: (target: AnyObject, ionizedModel: IonizedModel, meta: any, getPreopData: GetPreopData | undefined) => (...args: any[]) => any
   preop?: GetPreopData
   revert?: Revert
}

export type GetPreopData = (target: AnyObject, args?: any[]) => any;
type Revert = (model: AnyObject, data: { output: any, preopData: any, args: any[] }) => void


// A 'get op' is a o(1) get-like operation like set.has() or array.at()

// const TrackableOp = {
//    [TRACK_ENTRY]: useTrackableGetOp,
//    [TRACK_MODEL]: useTrackableOp,
//    [TRACK_MODEL_WITH_CALLBACK]: useTrackableOpWithCallback
// }

export function useTrackableGetOp(
   target: AnyObject,
   model: IonizedModel,
   op: PropertyKey,
) {
   const fn = target[op]
   const trackableOp = function trackableGetOp(arg: any) {
      console.log('calling trackableGetOp')
      if (__DEV__) emitSignal();
      const value = toRaw(arg)
      getActiveTracker()?.track(asAtomicOp(model, op, value))
      return maybeIonize(fn.call(target, value))
   }
   return trackableOp
}


// a `trackable op` is a method like 'values()' or 'entries()' that tracks the entire ionic model as a watch subject rather than a specific entry or property
export function useTrackableOp(
   target: AnyObject,
   model: IonizedModel,
   op: PropertyKey,
   transformArgs: (args: any[]) => any[] = noTransform,
   transformTarget: (target: AnyObject, args: any[]) => AnyObject = noTransform,
   transformReturn: (result: any) => any = noTransform
) {
   const fn = target[op]
   return function trackableOp(...args: any[]) {
      if (__DEV__) emitSignal();
      const _args = transformArgs(args);
      // if(op === 'indexOf'){
      console.log('@% op', op)
      console.log('@% args', args)
      console.log('@% transformed args', _args)
      console.log('@% target', target)
      console.log('@% transformed target', transformTarget(target, _args))
      // }
      getActiveTracker()?.track(quarkOf(model))
      return transformReturn(fn.call(transformTarget(target, _args), ..._args))
   }
}

export function useTrackableOpWithCallback(
   target: AnyObject,
   model: IonizedModel,
   op: PropertyKey,
) {
   return useTrackableOp(target, model, op, undefined, (target) => ionizedDecoy(target))
}

export function useTrackableIterative(
   target: AnyObject,
   model: IonizedModel,
   op: PropertyKey,
) {
   return useTrackableOp(target, model, op, undefined, (target, args) => ionizedDecoy(args[1] ?? target))
}

/**
 * A method that produces a new version of the original data structure by iterating over the original, eg. array.map()
 * @param target 
 * @param model 
 * @param op 
 * @returns 
 */
export function useTrackableCreativeIterative(
   target: AnyObject,
   model: IonizedModel,
   op: PropertyKey,
) {
   return useTrackableOp(
      target, model, op,
      undefined,
      (target, args) => ionizedDecoy(args[1] ?? target),
      (result) => ionize(result)
   )
}

/**
 * A method that produces a new version of the original data structure, eg. array.toReversed()
 * @param target 
 * @param model 
 * @param op 
 * @returns 
 */
export function useTrackableCreativeOp(
   target: AnyObject,
   model: IonizedModel,
   op: PropertyKey,
) {
   return useTrackableOp(
      target, model, op, undefined, undefined,
      (result) => ionize(result)
   )
}

/**
 * A method that produces a new version of the original data structure, eg. array.toReversed()
 * @param target 
 * @param model 
 * @param op 
 * @returns 
 */
export function useTrackableCreativeOpWithArgs(
   target: AnyObject,
   model: IonizedModel,
   op: PropertyKey,
) {
   return useTrackableOp(
      target, model, op,
      args => args.map(item => toRaw(item)),
      undefined,
      (result) => ionize(result)
   )
}



export function useTrackableCheck(
   target: AnyObject,
   model: IonizedModel,
   op: PropertyKey,
) {
   return useTrackableOp(
      target,
      model,
      op,
      (args) => (args[0] = toRaw(args[0]), args),
      target => rawDecoy(target)
   )
}



function noTransform(value: any) {
   return value;
}

// a `trackable op` is a method like 'filter' that tracks the entire ionic model as a watch subject rather than a specific entry or property
// and also receives a callback that receives property values of the model
// export function useTrackableOpWithCallback(
//    model: IonizedModel,
//    target: AnyObject,
//    op: PropertyKey,
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

function ionizedDecoy(target: AnyObject) {
   return new Proxy(target, {
      get(target, key) {
         return maybeIonize(target[key])
      },
      set(target, key, value) {
         target[key] = toRaw(value)
         return true;
      }
   })
}

function rawDecoy(target: AnyObject) {
   return new Proxy(target, {
      get(target, key) {
         return toRaw(target[key])
      },
      set(target, key, value) {
         target[key] = toRaw(value)
         return true;
      }
   })
}

const ionicStructureMap = new Map([[
   Object, {
      nontrackableKeys: {
         constructor: true,
         __defineGetter__: true,
         __defineSetter__: true,
         // hasOwnProperty: true,
         __lookupGetter__: true,
         __lookupSetter__: true,
         isPrototypeOf: true,
         propertyIsEnumerable: true,
         toString: true,
         valueOf: true,
         __proto__: true,
         toLocaleString: true
      }
   }
]]) as Map<any, CustomIonizedModelConfig>

function isCustomIonicStructure(value: any) {
   return ionicStructureMap.has(value);
}

// function getMutatingOps(DataStructure: any) {
//     const config = ionicStructureMap.get(DataStructure)
//     if (!config) throw new Error(`Cannot find config for this data structure: ${DataStructure.toString()}`)
//     return config.mutatingOps
// }

function emitAfterSet(model: IonizedModel, key: PropertyKey, newValue: any, oldValue: any) {
   const quark = quarkOf(model)
   const configs = quark.structureConfigs;
   if (configs[0].structure === Object) return;
   for (const config of configs) {
      const afterSet = config.afterSet
      if (afterSet) afterSet(model, quark, key, newValue, oldValue)
   }
}


function getNonTrackableKeys(structureKey: any) {
   return ionicStructureMap.get(structureKey)?.nontrackableKeys
}


export function isNonTrackable(key: PropertyKey, structureConfigs: CustomIonizedModelConfig[]) {
   for (const config of structureConfigs) {
      const nontrackableKeys = config.nontrackableKeys
      if (nontrackableKeys && key in nontrackableKeys) return true;
      if (typeof key === 'symbol' && key.description && nontrackableKeys && key.description in nontrackableKeys) return true;
   }
   return false;
}

const INTERNAL_OP = "[[INTERNAL]]"
const KEY_IN_OP = "[[in]]"

//TODO:
// - I really need to think through if property changes should trigger the whole model
// - adding and deleting properties
export function createIonizedModel(
   target: object,
   methods: AnyObject | undefined,
) {
   const ionizedModel = new Proxy(target, {
      get(target, key, receiver) {
         __DEV__proxyGetterAssertions(ionizedModel, receiver)
         const getValue = switchMap.get(key)
         if (getValue) return getValue();
         return initialAccess(
            target,
            methods,
            ionizedModel,
            modelQuark,
            structureConfigs,
            key,
            switchMap
         )
      },

      set(target, key, value) {
         return reactiveSetter(
            ionizedModel,
            target,
            key,
            value
         )
      },

      has(target, key) {
         //FIX: This is not going to work asAtomicOp because currently I'm storing the atomic op on the function itself... I need to use a map again...
         // getActiveTracker()?.track(asAtomicOp(ionizedModel, '[[in]]', key)) //TODO: trigger [[in]] when property is added or property is deleted
         const getValue = switchMap.get(key)
         if (getValue)
            return true;
         return key in target || !!methods && key in methods
      },
      ownKeys(target) {
         getActiveTracker()?.track(asAtomicOp(ionizedModel, INTERNAL_OP, 'ownKeys')) //TODO: trigger [[in]] when any new property is added or deleted
         return Reflect.ownKeys(target)
      },

      getOwnPropertyDescriptor(target, key) {
         //TODO: track
         console.log('getOwnPropertyDescriptor', key)
         return Reflect.getOwnPropertyDescriptor(target, key)
      },

      defineProperty(target: AnyObject, key, attributes) {
         const success = Reflect.defineProperty(target, key, attributes)
         if (!success) return false;
         if (!(key in target)) {
            triggerKeysChange(ionizedModel, key)
         }
         else if (target[key] !== attributes.value) {
            getAtomicPion(ionizedModel, key)?.trigger()
         }
         modelQuark.trigger()
         //TODO: record mutation?
         return true;
      },

      deleteProperty(target: AnyObject, key) {
         const success = delete target[key]
         if (!success) return false;
         if (target[key] !== undefined) {
            getAtomicPion(ionizedModel, key)?.trigger()
         }
         if (key in target) {
            triggerKeysChange(ionizedModel, key)
         }
         modelQuark.trigger()
         //TODO: record mutation?
         return true;
      },

      setPrototypeOf(target, proto) {
         debug.warn("[DISALLOWED] Cannot setPrototypeOf ionized model")
         return false
      },

      isExtensible(target) {
         getActiveTracker()?.track(asAtomicOp(ionizedModel, INTERNAL_OP, 'isExtensible'))
         return Reflect.isExtensible(target)
      },

      preventExtensions(target) {
         getAtomicOp(ionizedModel, INTERNAL_OP, 'isExtensible')?.trigger()
         return Reflect.preventExtensions(target)
      },

   }) as IonizedModel

   const structureConfigs = getStructureConfigs(target);
   const modelQuark = new IonizedModelQuark(ionizedModel, target, methods, structureConfigs)
   const switchMap = createProxySwitchMap(modelQuark)

   if (!methods) registerIonizedModel(ionizedModel, target)
   return ionizedModel
}

export type ProxySwitchMap = Map<string | symbol, () => any>

function triggerKeysChange(model: IonizedModel, key: PropertyKey) {
   getAtomicOp(model, INTERNAL_OP, 'ownKeys')?.trigger()
   getAtomicOp(model, KEY_IN_OP, key)?.trigger()
   //QUESTION: shoule this trigger the whole model? I don't think so?
}

function initialAccess(
   target: AnyObject,
   methods: AnyObject | undefined,
   ionizedModel: IonizedModel,
   quark: IonizedModelQuark,
   structureConfigs: CustomIonizedModelConfig[],
   key: string | symbol,
   switchMap: ProxySwitchMap
) {
   if (methods && key in methods) {
      return bindMethod(methods[key], key, ionizedModel, switchMap)
   }
   const _key = methods ? getTargetKey(methods, key) : key;
   const nativeMethodConfig = getNativeMethodConfig(_key, structureConfigs)
   if (nativeMethodConfig) { //NOTE: this block must be above target[_key] for Array.from(set) to work
      return bindNativeMethod(
         nativeMethodConfig,
         _key,
         key,
         target,
         ionizedModel,
         quark,
         switchMap
      )
   }
   const value = target[_key]
   if (isMethod(value)) {
      return bindMethod(value, key, ionizedModel, switchMap)
   }
   return initialPropertyAccess(
      target,
      ionizedModel,
      structureConfigs,
      key,
      value,
      switchMap
   )
}

export function initialPropertyAccess(
   target: AnyObject,
   ionizedModel: IonizedModel,
   structureConfigs: CustomIonizedModelConfig[],
   key: string | symbol,
   value: any,
   switchMap: ProxySwitchMap,
   transformValue: (value: any) => any = (value: any) => value
) {
   const isIonAccessKey = typeof key === 'string' && key[0] === '$' //TODO: need to use regex

   if (isNonTrackable(key, structureConfigs)) { //QUESTION: is this worth it? //TODO: include non-writable properties
      return initialNonTrackablePropertyAccess(target, key, value, switchMap, transformValue);
   }

   if (isIonAccessKey) {
      return initialIonAccess(ionizedModel, target, key, value, switchMap, transformValue);
   }

   if (isIon(value)) {
      return initialAbsorbedIonStateAccess(key, value, switchMap, transformValue)
   }

   return initialTrackableStateAccess(ionizedModel, target, key, value, switchMap, transformValue)
}


//FIX: figure out where to call traceableMethodWrap
function bindMethod(method: Function, key: string | symbol, proxy: IonizedModel, switchMap: ProxySwitchMap) {
   if (!isMethod(method)) throw new Error('Invalid method')
   const boundMethod =
      // __DEV__ ?
      //    traceableMethodWrap('Ionized Method', proxy, key, method.bind(proxy))
      //    : 
      method.bind(proxy);
   switchMap.set(key, () => boundMethod)
   return boundMethod;
}

function initialNonTrackablePropertyAccess(
   target: AnyObject,
   key: string | symbol,
   value: any,
   switchMap: ProxySwitchMap,
   transformValue: Function
) {
   switchMap.set(key, () => transformValue(target[key]))
   return transformValue(value);
}

function initialIonAccess(
   proxy: IonizedModel,
   target: AnyObject,
   key: string,
   value: any,
   switchMap: ProxySwitchMap,
   transformValue: Function
) {
   if (isIon(value)) {
      // Absorbed Ion
      switchMap.set(key, () => transformValue(target[key]))
      return transformValue(value); // { $count: $count } get ion case
   }
   const _key = key.slice(1);
   if (value === undefined) {
      const _value = target[_key]
      if (isIon(_value)) {
         // Absorbed Ion
         switchMap.set(key, () => transformValue(target[_key]))
         return transformValue(_value);  // { count: $count } get ion case
      }
      // Prop Ion
      const propIon = asPion(proxy, _key)  // { count: 0}  get ion case
      switchMap.set(key, () => transformValue(propIon))
      return transformValue(propIon);
   }
   // Invalid property { $count: 0 } 
   initialTrackableStateAccess(proxy, target, key, value, switchMap, transformValue)
   if (__DEV__) console.warn('Invalid Property Key initialization: Property keys prefixed with a single dollar sign ($) are reserved for ions.\n' + asTraceable(proxy).origin)
}

function initialAbsorbedIonStateAccess(key: string | symbol, value: any, switchMap: ProxySwitchMap, transformValue: Function) {
   switchMap.set(key, () => transformValue(maybeIonize(value())))
   return transformValue(maybeIonize(value())); // { count: $count } get value case
}

export function getTargetKey(methods: AnyObject, key: string | symbol) {
   const keyWithoutUnderscorePrefix = typeof key === 'string' && key.startsWith('_') ? key.slice(1) : key;
   if (keyWithoutUnderscorePrefix in methods) return keyWithoutUnderscorePrefix;
   return key;
}

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

function initialTrackableStateAccess(
   ionizedModel: IonizedModel,
   target: AnyObject,
   key: string | symbol,
   value: any,
   switchMap: ProxySwitchMap,
   transformValue: Function
) {
   function getState(value: any) {
      const _value = maybeIonize(value)
      const tracker = getActiveTracker()
      if (tracker) {
         const pion = asPionQuark(ionizedModel, key)
         if (pion) tracker.track(pion) //TODO: Tracking properties that are derivations (just a getter, no setter) or non-writable is superfluous
      }
      return transformValue(_value);
   }
   switchMap.set(key, () => getState(target[key]))
   return getState(value)
}

export function maybeIonize(value: any) {
   if (!isObject(value))
      return value;
   return ionize(value)
}



export function isMethod(value: any): value is Function {
   return value instanceof Function && !isIon(value)
}



export function accessMethod(
   target: AnyObject,
   proxy: IonizedModel,
   receiver: AnyObject,
   key: PropertyKey,
   boundMethodMap: Map<PropertyKey, Function>,
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
function getBoundMethod(
   proxy: IonizedModel,
   key: PropertyKey,
   boundMethodMap: Map<PropertyKey, Function>,
   method?: Function
) {
   let boundMethod = boundMethodMap.get(key)
   if (boundMethod) return boundMethod;
   if (method) {
      boundMethod =
         // __DEV__ ?
         // traceableMethodWrap('Ionized Method', proxy, key, method.bind(proxy))
         // : 
         method.bind(proxy);
      boundMethodMap.set(key, boundMethod!)
      return boundMethod;
   }
   throw new Error('No method provided')
}

export function isNativeMethod(key: PropertyKey, structureConfigs: CustomIonizedModelConfig[]) {
   for (const structure of structureConfigs) {
      const mutatingOps = structure.mutatingOps
      if (mutatingOps && key in mutatingOps)
         return true;
      const trackableOps = structure.trackableOps
      if (trackableOps && key in trackableOps)
         return true;
   }
   return false;
}

export function getNativeMethodConfig(
   nativeKey: string | symbol,
   structureConfigs: CustomIonizedModelConfig[],
) {
   for (const config of structureConfigs) {
      const mutatingOps = config.mutatingOps
      if (mutatingOps && nativeKey in mutatingOps) {
         return mutatingOps[nativeKey]
      }
      const trackableOps = config.trackableOps
      if (trackableOps && nativeKey in trackableOps) {
         return trackableOps[nativeKey]
      }
   }
   return undefined;
}

//FIX: figure out where to call traceableMethodWrap
function bindNativeMethod(
   config: CreateTrackableOp | AnyObject,
   nativeKey: string | symbol,
   publicKey: string | symbol,
   target: AnyObject,
   ionizedModel: IonizedModel,
   quark: IonizedModelQuark,
   switchMap: ProxySwitchMap,
) {
   if (isFunction(config)) {
      // trackable ops
      const op = config(target, ionizedModel, nativeKey)
      switchMap.set(publicKey, () => op)
      return op;
   }
   else {
      const createOp = config.createOp
      const getPreopData = config.preop
      const op =
         // __DEV__ ? traceableMethodWrap('Ionized Method', ionizedModel, nativeKey, createOp(target, ionizedModel, quark, getPreopData))
         // : 
         createOp(target, ionizedModel, quark, getPreopData)
      switchMap.set(publicKey, () => op)
      return op;
   }
}



export function createProxySwitchMap(meta: AnyObject) {
   let labelName: string | undefined;

   function __DEV__label(label: string) {
      labelName = label;
   }

   return new Map([
      [QUARK as any, () =>
         meta as any
      ],
      ['labelName', () =>
         labelName
      ],
      ['__DEV__label', () =>
         __DEV__label
      ],
   ])
}

export function __DEV__proxyGetterAssertions(proxy: AnyObject, receiver: AnyObject) {
   if (proxy !== receiver)
      throw new Error('An ionized model cannot serve as a prototype')
   emitSignal()
}


export function reactiveSetter(
   model: IonizedModel,
   target: AnyObject,
   key: string | symbol,
   value: unknown,
) {
   const quark = quarkOf(model)
   if (quark.isNewProperty(key)) {
      quark.registerNewProperty(key)
      // TODO: trigger 
      return true;
   }

   const oldState = target[key];

   if (isIon(oldState)) {
      return setAbsorbedIonState(model, key, oldState, value) // we let absorbed ion to decide whether to ionize value or not
   }

   __DEV__traceMethodCall('IonizedModel', model, key)

   if (!isWritable(target, key)) {
      if (__DEV__) console.warn(`${String(key)} is not writable.`)
      return false;
   }

   const newState = maybeIonize(value)

   if (oldState === newState) {
      // if (__DEV__) getObservedPion(ionizedModel, key)?.trigger(newValue, oldValue) //TODO: what about auto-ionizing new value?
      return true;
   }

   target[key] = newState

   storeSnapshot(quark)

   emitAfterSet(model, key, newState, oldState) // for array.length === 0 and array.at(-1)

   recordMutation(quark, new Mutation(
      model,
      '[[set]]',
      [key, newState],
      newState,
      oldState,
   ))

   quark.trigger()
   getAtomicPion(model, key)?.trigger()

   runSyncEffects()

   return true;
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
//    const { asParticle, asWatched } = quarkOf(model);
//    asParticle?.triggerCompounds()
//    asWatched?.triggerEffects()
// }








export function setAbsorbedIonState(model: IonizedModel, key: PropertyKey, ion: Ion, value: unknown) {
   const oldState = ion()
   if (hasQuark(ion) && 'state' in ion) {
      try {
         ion.state = value;
      }
      catch (err) {
         if (__DEV__) throw new Error("Absorbed AtomicIon is read only") //TODO: since readonly is only being enforced at the typescript level, make sure typescript prevents mutation of readonly absorbed ions
         return false;
      }
      const newState = ion.state // get the state that has been maybeIonized

      emitAfterSet(model, key, newState, oldState)

      quarkOf(model).trigger()

      return true;
   }
   if (__DEV__) throw new Error("Absorbed AtomicIon is read only")
   return false;
}

// function getMutation(ion: HasQuark<Mutable>) {
//    const quark = quarkOf(ion)
//    return quark.mutation;
// }


function isWritable(target: Object, key: PropertyKey) {
   const descriptor = Object.getOwnPropertyDescriptor(target, key);
   if (!descriptor) return true;
   if (descriptor.writable === true) return true;
   return false;
}