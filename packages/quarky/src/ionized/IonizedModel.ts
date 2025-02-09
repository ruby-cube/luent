import { AnyObject } from "@rue/types";
import { ionize, Ionized, isIonizedModel, registerIonizedModel, toRaw } from "./ionize";
import { asTraceable, emitSignal } from "../debug/debug";
import { asTrackedOp, getTrackedOp } from "./TrackedOp";
import { IonizedModel, storeSnapshot } from "./ionize";
import { trigger, triggerIonicAtom, triggerIonizedModel } from "../reactivity/x_trigger";
import { MetaIonizedModel } from "./MetaIonizedModel";
import { isFunction, noop } from "@rue/utils";
import { AnyIon, isIon } from "../ion/Ion";
import { asPropIon, asTrackedProp, getObservedProp, registerEntryKeyValidator } from "./PrimaryPion";
import { __DEV__trace, __DEV__traceMethodCall, traceableMethodWrap } from "../debug/debug";
import { QUARKS, quarksOf } from "../Quarks";
import { getActiveTracker } from "../ionic/IonicCompound";




export const UNDEFINED_OP: Function = noop

// A 'get op' is a o(1) get-like operation like set.has() or array.at()
export function useTrackableGetOp(
   reactive: IonizedModel,
   target: AnyObject,
   op: string,
   fn: (key: any) => any,
) {
   return function trackableGetOp(arg: any) {
      if (__DEV__) emitSignal();
      const tracker = getActiveTracker()
      const _arg = toRaw(arg)
      // const value = Reflect.apply(fn, target, _arg)
      if (!tracker)
         return fn.call(target, _arg)
      tracker.track(asTrackedOp(reactive, op, _arg))
      return fn.call(target, _arg)
   }
}


// a `trackable op` is a method like 'find' or 'filter' that tracks the entire ionic model as a watch subject rather than a specific entry or property
export function useTrackableOp() {
   //TODO: see if people would find this useful
}

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
   const { isEntryKey } = config
   if (isEntryKey) {
      registerEntryKeyValidator(isEntryKey)
   }

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

type BeforeSetCallback = (ionizedModel: IonizedModel, meta: MetaIonizedModel, key: PropertyKey, oldValue: any) => void
type AfterSetCallback = (ionizedModel: IonizedModel, meta: MetaIonizedModel, key: PropertyKey, newValue: any, oldValue: any) => void

type CreateTrackableOp = (target: AnyObject, ionizedModel: IonizedModel<AnyObject>) => (...args: any[]) => any

type MutatingOpConfig = {
   createOp: (target: AnyObject, ionizedModel: IonizedModel<AnyObject>, meta: any, getPreopData: GetPreopData | undefined) => (...args: any[]) => any
   preop?: GetPreopData
   revert?: Revert
}

export type GetPreopData = (target: AnyObject, args?: any[]) => any;
type Revert = (model: AnyObject, data: { output: any, preopData: any, args: any[] }) => void



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

function emitAfterSet(structureConfigs: CustomIonizedModelConfig[], ionizedModel: IonizedModel, meta: MetaIonizedModel, key: PropertyKey, newValue: any, oldValue: any) {
   if (structureConfigs[0].structure === Object) return;
   for (const config of structureConfigs) {
      const afterSet = config.afterSet
      if (afterSet) afterSet(ionizedModel, meta, key, newValue, oldValue)
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


export function createIonizedModel(
   target: object,
   methods: AnyObject | undefined,
) {

   const structureConfigs = getStructureConfigs(target);
   const metaIonizedModel = new MetaIonizedModel(target, methods, structureConfigs)
   const switchMap = createProxySwitchMap(metaIonizedModel)

   const ionizedModel = new Proxy(target, {
      has(target, key) {
         const getValue = switchMap.get(key)
         if (getValue)
            return true;
         return key in target || !!methods && key in methods
      },
      get(target, key, receiver) {
         __DEV__proxyGetterAssertions(ionizedModel, receiver)
         const getValue = switchMap.get(key)
         if (getValue) return getValue();
         return initialAccess(
            target,
            methods,
            ionizedModel,
            metaIonizedModel,
            structureConfigs,
            key,
            switchMap
         )
      },
      set(target, key, value, receiver) {
         if (key === 'has') console.warn(key, value)
         return reactiveSetter(
            structureConfigs,
            ionizedModel,
            metaIonizedModel,
            target,
            key,
            value,
            receiver
         )
      }
   }) as Ionized<AnyObject>

   metaIonizedModel.initIonizedModel(ionizedModel)
   if (!methods) registerIonizedModel(ionizedModel, target)
   return ionizedModel
}

export type ProxySwitchMap = Map<string | symbol, () => any>


function initialAccess(
   target: AnyObject,
   methods: AnyObject | undefined,
   ionizedModel: IonizedModel,
   metaIonizedModel: MetaIonizedModel,
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
         metaIonizedModel,
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



function bindMethod(method: Function, key: string | symbol, proxy: AnyObject, switchMap: ProxySwitchMap) {
   if (!isMethod(method)) throw new Error('Invalid method')
   const boundMethod =
      __DEV__ ?
         traceableMethodWrap('Ionized Method', proxy, key, method.bind(proxy))
         : method.bind(proxy);
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
   proxy: AnyObject,
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
      const propIon = asPropIon(proxy, _key)  // { count: 0}  get ion case
      switchMap.set(key, () => transformValue(propIon))
      return transformValue(propIon);
   }
   // Invalid property { $count: 0 } 
   initialTrackableStateAccess(proxy, target, key, value, switchMap, transformValue)
   if (__DEV__) console.warn('Invalid Property Key initialization: Property keys prefixed with a single dollar sign ($) are reserved for ions.\n' + asTraceable(proxy).__DEV__origin)
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
   ionizedModel: AnyObject,
   target: AnyObject,
   key: string | symbol,
   value: any,
   switchMap: ProxySwitchMap,
   transformValue: Function
) {
   function getState(value: any) {
      const _value = maybeIonize(value)
      const tracker = getActiveTracker()
      if (tracker) tracker.track(asTrackedProp(ionizedModel, key)) //TODO: Tracking properties that are derivations (just a getter, no setter) or non-writable is superfluous
      return transformValue(_value);
   }
   switchMap.set(key, () => getState(target[key]))
   return getState(value)
}

function maybeIonize(value: any) {
   if (!(value instanceof Object))
      return value;
   return ionize(value)
}



export function isMethod(value: any): value is Function {
   return value instanceof Function && !isIon(value)
}



export function accessMethod(
   target: AnyObject,
   proxy: AnyObject,
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

function getBoundMethod(
   proxy: AnyObject,
   key: PropertyKey,
   boundMethodMap: Map<PropertyKey, Function>,
   method?: Function
) {
   let boundMethod = boundMethodMap.get(key)
   if (boundMethod) return boundMethod;
   if (method) {
      boundMethod =
         __DEV__ ?
            traceableMethodWrap('Ionized Method', proxy, key, method.bind(proxy))
            : method.bind(proxy);
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

function bindNativeMethod(
   config: Function | AnyObject,
   nativeKey: string | symbol,
   publicKey: string | symbol,
   target: AnyObject,
   ionizedModel: IonizedModel,
   meta: MetaIonizedModel,
   switchMap: ProxySwitchMap,
) {
   if (isFunction(config)) {
      const op = config(target, ionizedModel)
      switchMap.set(publicKey, () => op)
      return op;
   }
   else {
      const createOp = config[nativeKey].createOp
      const getPreopData = config[nativeKey].preop
      const op = __DEV__ ? traceableMethodWrap('Ionized Method', ionizedModel, nativeKey, createOp(target, ionizedModel, meta, getPreopData))
         : createOp(target, ionizedModel, meta, getPreopData)
      switchMap.set(publicKey, () => op)
      return op;
   }
}



export function createProxySwitchMap(meta: AnyObject) {
   let __DEV__labelName: string | undefined;

   function __DEV__label(label: string) {
      __DEV__labelName = label;
   }

   return new Map([
      [QUARKS as any, () =>
         meta as any
      ],
      ['__DEV__labelName', () =>
         __DEV__labelName
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
   structureConfigs: CustomIonizedModelConfig[], // and Tuple
   ionizedModel: IonizedModel,
   metaIonizedModel: MetaIonizedModel,
   target: AnyObject,
   key: string | symbol,
   newValue: any,
   receiver: AnyObject
) {
   if (metaIonizedModel.isNewProperty(key)) metaIonizedModel.registerNewProperty(key)

   const oldValue = Reflect.get(target, key, receiver);
   if (isIon(oldValue) && !isIon(newValue)) {
      return setAbsorbedIon(oldValue, newValue, ionizedModel, key, oldValue(), structureConfigs)
   }

   __DEV__traceMethodCall('IonizedModel', ionizedModel, key)

   if (oldValue === newValue
      || isNonTrackable(key, structureConfigs)
      || !isWritable(target, key)) {
      const prop = getObservedProp(ionizedModel, key)
      if (prop) trigger(prop, newValue, oldValue)
      target[key] = newValue
      return true;
   }

   const _newValue = toRaw(isIon(newValue) ? newValue() : newValue)
   const _oldValue = isIon(oldValue) ? oldValue() : oldValue

   target[key] = isIon(newValue) ? newValue : _newValue

   storeSnapshot(metaIonizedModel)

   const prop = getObservedProp(ionizedModel, key);
   if (prop) {
      trigger(prop, _newValue, _oldValue)
   }

   emitAfterSet(structureConfigs, ionizedModel, metaIonizedModel, key, _newValue, _oldValue)

   triggerIonizedModel(
      ionizedModel,
      '[[set]]',
      [key, _newValue],
      _newValue,
      _oldValue,
   )

   return true;
}



export function setAbsorbedIon(ion: AnyIon, value: any, ionizedModel: IonizedModel, key: PropertyKey, oldValue: any, structureConfigs: CustomIonizedModelConfig[]) {
   if ('state' in ion) {
      try {
         ion.state = value;
      }
      catch (err) {
         if (__DEV__) throw new Error("Absorbed AtomicIon is read only") //TODO: since readonly is only being enforced at the typescript level, make sure typescript prevents mutation of readonly absorbed ions
         return false;
      }

      // const prop = getObservedProp(ionizedModel, key); //TODO: I don't think this is needed
      // if (prop) {
      //    trigger(prop, value, oldValue)
      // }

      emitAfterSet(structureConfigs, ionizedModel, quarksOf(ionizedModel), key, value, oldValue)

      triggerIonizedModel(
         ionizedModel,
         '[[set]]',
         [key, value],
         value,
         oldValue,
      )
      return true;
   }
   if (__DEV__) throw new Error("Absorbed AtomicIon is read only")
   return false;
}


function isWritable(target: Object, key: PropertyKey) {
   const descriptor = Reflect.getOwnPropertyDescriptor(target, key);
   if (descriptor?.writable === true) return true;
   return false;
}