import { AnyObject } from "@rue/types";
import { ionize, registerIonizedModel, toRaw } from "./ionize";
import { asTraceable, emitSignal } from "../debug/debug";
import { asAtomicOp, getAtomicOp } from "./AtomicOp";
import { storeSnapshot } from "./ionize";
import { IonizedModelQuark } from "./IonizedModelQuark";
import { debug, isFunction, isObject, noop } from "@rue/utils";
import { Ion, isIon } from "../ion/Ion";
import { __DEV__trace } from "../debug/debug";
import { HasQuark, hasQuark, Quark, QUARK, quarkOf } from "../Quark";
import { getActiveTracker } from "../ionic/IonicCompound";
import { Capsule } from "../capsule/Capsule";
import { Mutable, MutableEntity, MutableMorph, Mutation, recordMutation } from "../Mutable";
import { asPion, asPionQuark, getAtomicPion } from "./Pion";
import { ParticleMorph } from "../compound/Particle";
import { CompoundMorph } from "../compound/Compound";
import { Watchable } from "../watch/Watched";
import { IonizedCompound } from "./IonizedCompound";
import { runSyncEffects } from "../effect-cycle/SyncEffects";
import { MUTABLE } from "../ion/AtomicIon";
import { getIonizableMethodDef, TriggeringOpDef, TrackableOpDef, triggeringPropertySetOp } from "./makeIonizable";
import { normalize } from "path";

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
   transformInput?: (args: any[]) => any[],
   transformTarget?: (target: AnyObject, args: any[]) => AnyObject,
   transformOutput?: (output: any) => any
) => (...args: any[]) => any


type MutatingOpConfig = {
   createOp: (target: AnyObject, ionizedModel: IonizedModel, meta: any, getPreopData: GetPreopData | undefined) => (...args: any[]) => any
   preop?: GetPreopData
   revert?: Revert
}

export type GetPreopData = (target: AnyObject, args?: any[]) => any;
type Revert = (model: AnyObject, data: { output: any, preopData: any, args: any[] }) => void



// a `trackable op` is a method like 'values()' or 'entries()' that tracks the entire ionic model as a watch subject rather than a specific entry or property
export function useTrackableOp(
   target: AnyObject,
   ionized: IonizedModel,
   op: PropertyKey,
   config: TrackableOpDef,
) {
   const { createOp, track, input = noTransform, output = noTransform, this: transformThis = noTransform } = config

   const fn = createOp ? createOp(target, op) : target[op]

   return function trackableOp(...args: any[]) {
      if (__DEV__) emitSignal();
      const _args = input(args);
      getActiveTracker()?.track(asTrackable(track(ionized, op, _args)))
      return output(fn.call(transformThis(target, _args), ..._args), ionized)
   }
}

function asTrackable(tracked: [IonizedModel] | [IonizedModel, PropertyKey, any[]]) {
   const [model, op, input] = tracked;
   if (op) {
      return asAtomicOp(model, op, input![0]) //TODO: atomicOps that have more than one 'entry key'
   } else {
      return quarkOf(model)
   }
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


// const ionicStructureMap = new Map([[
//    Object, {
//       nontrackableKeys: {
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

// function emitAfterSet(model: IonizedModel, key: PropertyKey, newValue: any, oldValue: any) {
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


export function isNonTrackable(key: PropertyKey, structureConfigs: CustomIonizedModelConfig[]) { //TODO: ?
   // for (const config of structureConfigs) {
   //    const nontrackableKeys = config.nontrackableKeys
   //    if (nontrackableKeys && key in nontrackableKeys) return true;
   //    if (typeof key === 'symbol' && key.description && nontrackableKeys && key.description in nontrackableKeys) return true;
   // }
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
   mutable: boolean,
   isPublic: boolean = true
) {

   const ionizedModel = new Proxy(target, {
      get(target, key, receiver) {
         __DEV__proxyGetterAssertions(ionizedModel, receiver)
         const getValue = propertyMap.get(key)
         if (getValue) return getValue();
         return initialAccess(
            target,
            methods,
            thisModel,
            modelQuark,
            key,
            propertyMap,
         )
      },

      set(target, key, value) {
         if (!mutable) {
            debug.error('This model is encapsulated. Cannot set value of properties. Must use methods to set state')
            return false;
         }
         return reactiveSetter(
            ionizedModel,
            target,
            key,
            value,
            setOp
         )
      },

      has(target, key) {
         // getActiveTracker()?.track(asAtomicOp(ionizedModel, '[[in]]', key)) //TODO: trigger [[in]] when property is added or property is deleted
         const getValue = propertyMap.get(key)
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

   const modelQuark = new IonizedModelQuark(ionizedModel, target, methods)
   let _super: AnyObject | undefined;
   const propertyMap = isPublic ? new Map([
      [QUARK as any, () => modelQuark as any]
   ]) : new Map([
      [QUARK as any, () => modelQuark as any],
      ['super', () => _super ?? createIonizedModel(target, undefined, MUTABLE, false)]
   ])

   const setOp = useMutatingOp(target, ionizedModel, '[[set]]', triggeringPropertySetOp)

   const thisModel = mutable ? ionizedModel : createIonizedModel(target, methods, true, false)

   if (!methods) registerIonizedModel(ionizedModel, target)

   return ionizedModel
}

export type ProxyPropertyMap = Map<string | symbol, () => any>

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
   key: string | symbol,
   propertyMap: ProxyPropertyMap,
) {
   if (methods && key in methods) {
      return bindMethod(methods[key], key, ionizedModel, propertyMap)
   }
   const nativeMethodDef = getIonizableMethodDef(target, key)
   if (nativeMethodDef) { //NOTE: this block must be above target[_key] for Array.from(set) to work
      return bindNativeMethod(
         nativeMethodDef,
         key,
         target,
         ionizedModel,
         quark,
         propertyMap,
      )
   }
   const value = target[key]
   if (isMethod(value)) {
      return bindMethod(value, key, ionizedModel, propertyMap)
   }
   return initialPropertyAccess(
      target,
      ionizedModel,
      key,
      value,
      propertyMap
   )
}

export function initialPropertyAccess(
   target: AnyObject,
   ionizedModel: IonizedModel,
   // structureConfigs: CustomIonizedModelConfig[],
   key: string | symbol,
   value: any,
   propertyMap: ProxyPropertyMap,
   transformValue: (value: any) => any = (value: any) => value
) {
   const isIonAccessKey = typeof key === 'string' && key[0] === '$' //TODO: need to use regex

   // if (isNonTrackable(key)) { //QUESTION: is this worth it? //TODO: include non-writable properties
   //    return initialNonTrackablePropertyAccess(target, key, value, propertyMap, transformValue);
   // }

   if (isIonAccessKey) {
      return initialIonAccess(ionizedModel, target, key, value, propertyMap, transformValue);
   }

   if (isIon(value)) {
      return initialAbsorbedIonStateAccess(key, value, propertyMap, transformValue)
   }

   return initialTrackableStateAccess(ionizedModel, target, key, value, propertyMap, transformValue)
}


//FIX: figure out where to call traceableMethodWrap
function bindMethod(method: Function, key: string | symbol, proxy: IonizedModel, propertyMap: ProxyPropertyMap) {
   if (!isMethod(method)) throw new Error('Invalid method')
   const boundMethod =
      // __DEV__ ?
      //    traceableMethodWrap('Ionized Method', proxy, key, method.bind(proxy))
      //    : 
      method.bind(proxy);
   propertyMap.set(key, () => boundMethod)
   return boundMethod;
}

function initialNonTrackablePropertyAccess(
   target: AnyObject,
   key: string | symbol,
   value: any,
   propertyMap: ProxyPropertyMap,
   transformValue: Function
) {
   propertyMap.set(key, () => transformValue(target[key]))
   return transformValue(value);
}

function initialIonAccess(
   proxy: IonizedModel,
   target: AnyObject,
   key: string,
   value: any,
   propertyMap: ProxyPropertyMap,
   transformValue: Function
) {
   if (isIon(value)) {
      // Absorbed Ion
      propertyMap.set(key, () => transformValue(target[key]))
      return transformValue(value); // { $count: $count } get ion case
   }
   const _key = key.slice(1);
   if (value === undefined) {
      const _value = target[_key]
      if (isIon(_value)) {
         // Absorbed Ion
         propertyMap.set(key, () => transformValue(target[_key]))
         return transformValue(_value);  // { count: $count } get ion case
      }
      // Prop Ion
      const propIon = asPion(proxy, _key)  // { count: 0}  get ion case
      propertyMap.set(key, () => transformValue(propIon))
      return transformValue(propIon);
   }
   // Invalid property { $count: 0 } 
   initialTrackableStateAccess(proxy, target, key, value, propertyMap, transformValue)
   if (__DEV__) console.warn('Invalid Property Key initialization: Property keys prefixed with a single dollar sign ($) are reserved for ions.\n' + asTraceable(proxy).origin)
}

function initialAbsorbedIonStateAccess(key: string | symbol, value: any, propertyMap: ProxyPropertyMap, transformValue: Function) {
   propertyMap.set(key, () => transformValue(maybeIonize(value())))
   return transformValue(maybeIonize(value())); // { count: $count } get value case
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

function initialTrackableStateAccess(
   ionizedModel: IonizedModel,
   target: AnyObject,
   key: string | symbol,
   value: any,
   propertyMap: ProxyPropertyMap,
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
   propertyMap.set(key, () => getState(target[key]))
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
   config: TrackableOpDef | TriggeringOpDef,
   key: string | symbol,
   target: AnyObject,
   ionizedModel: IonizedModel,
   quark: IonizedModelQuark,
   propertyMap: ProxyPropertyMap,
) {
   if ('track' in config) {
      const op = useTrackableOp(
         target,
         ionizedModel,
         key,
         config
      )
      propertyMap.set(key, () => op)
      return op;
   }
   else {
      const op = useMutatingOp(
         target,
         ionizedModel,
         key,
         config
      )
      // __DEV__ ? traceableMethodWrap('Ionized Method', ionizedModel, nativeKey, createOp(target, ionizedModel, quark, getPreopData))
      // : 
      // createOp(target, ionizedModel, quark, getPreopData)
      propertyMap.set(key, () => op)
      return op;
   }
}


function useMutatingOp(
   target: AnyObject,
   model: IonizedModel,
   op: PropertyKey,
   config: TriggeringOpDef
) {
   const fnName = typeof op === 'string' ? 'ionic_' + op : 'ionic_mutating_op'
   const { shouldTrigger, triggers: getTriggers, input = noTransform, output: transformOutput = noTransform, createOp } = config
   const fn = createOp ? createOp(target, op) : target[op];
   const quark = quarkOf(model)

   const o = {
      [fnName](...args: any) {
         const _args = input(args)
         const preop = config.preop?.(target, _args)

         const output = transformOutput(fn.apply(target, _args), model); // perform mutation

         if (shouldTrigger && !shouldTrigger(preop)) return output;

         storeSnapshot(quark)

         recordMutation(quark, new Mutation(
            model,
            op,
            _args,
            output,
            preop
         ))

         const triggers = getTriggers(model, _args, preop);

         for (const trigger of triggers) {
            trigger();
         }

         runSyncEffects()

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
   target: AnyObject,
   key: string | symbol,
   value: unknown,
   setOp: (key: PropertyKey, value: any) => void
) {
   const quark = quarkOf(model)

   if (quark.isNewProperty(key)) {
      quark.registerNewProperty(key)
      setOp(key, value)
      return true;
   }

   const oldState = target[key]; //TODO: make sure key is correct for absorbed ions

   if (isIon(oldState)) {
      return setAbsorbedIonState(model, key, oldState, value) // we let absorbed ion to decide whether to ionize value or not
   }

   setOp(key, value)
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
   // const oldState = ion()
   if (hasQuark(ion) && 'state' in ion) {
      try {
         ion.state = value;
      }
      catch (err) {
         if (__DEV__) throw new Error("Absorbed AtomicIon is read only") //TODO: since readonly is only being enforced at the typescript level, make sure typescript prevents mutation of readonly absorbed ions
         return false;
      }
      // const newState = ion.state // get the state that has been maybeIonized

      // emitAfterSet(model, key, newState, oldState)

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