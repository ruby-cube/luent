import { AnyObject } from "@rue/types";
import { asMetaIonicModel, ionize, isIonizedModel, registerIonizedModel, toRaw } from "./ionize";
import { emitSignal } from "../debug";
import { getActiveTracker } from "../derivations/DependencyTracker";
import { asTrackedOp, getTrackedOp } from "./TrackedOp";
import { IonizedModel, storeSnapshot } from "./ionize";
import { trigger, triggerIonicAtom, triggerIonicModel } from "../trigger";
import { MetaIonicModel } from "./MetaIonicModel";
import { noop } from "@rue/utils";
import { getProtectedModelMeta, isProtectedProxy, isReadonlyProxy, PROTECTED_META } from "./ProtectedIonicModel";
import { META } from "../ReactiveEntity";
import { AnyIon, isIon } from "../ion/Ion";
import { asPropIon, asTrackedProp, getObservedProp, registerEntryKeyValidator } from "./PropIon";
import { protect } from "../protect";
import { READONLY } from "../ion/ProtectedIon";




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
      if (!tracker)
         return fn.call(target, _arg);
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
export function defineIonizedStructure(structureKey: any, config: CustomIonicModelConfig, override?: boolean) {
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

type CustomIonicModelConfig = {
   structure?: any;
   nontrackableKeys?: { [key: PropertyKey]: boolean };
   trackableOps?: { [key: PropertyKey]: CreateTrackableOp }
   mutatingOps?: { [key: PropertyKey]: MutatingOpConfig };
   beforeSet?: BeforeSetCallback; //TODO:
   afterSet?: AfterSetCallback;
   isEntryKey?: (model: AnyObject, key: PropertyKey) => boolean
   // getStructureKeys: (model: AnyObject) => any[]
}

type BeforeSetCallback = (ionicModel: IonizedModel, meta: MetaIonicModel, key: PropertyKey, oldValue: any) => void
type AfterSetCallback = (ionicModel: IonizedModel, meta: MetaIonicModel, key: PropertyKey, newValue: any, oldValue: any) => void

type CreateTrackableOp = (target: AnyObject, ionicModel: IonizedModel<AnyObject>) => (...args: any[]) => any

type MutatingOpConfig = {
   createOp: (target: AnyObject, ionicModel: IonizedModel<AnyObject>, meta: any, getPreopData: GetPreopData | undefined) => (...args: any[]) => any
   preop?: GetPreopData
   revert?: Revert
}

export type GetPreopData = (model: AnyObject, args?: any[]) => any;
type Revert = (model: AnyObject, data: { output: any, preopData: any, args: any[] }) => void

const something: Map<any, { dog?: number }> = new Map([[Object, { dog: 9 }]])


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
]]) as Map<any, CustomIonicModelConfig>

function isCustomIonicStructure(value: any) {
   return ionicStructureMap.has(value);
}

// function getMutatingOps(DataStructure: any) {
//     const config = ionicStructureMap.get(DataStructure)
//     if (!config) throw new Error(`Cannot find config for this data structure: ${DataStructure.toString()}`)
//     return config.mutatingOps
// }

function emitAfterSet(structureConfigs: CustomIonicModelConfig[], ionicModel: IonizedModel, meta: MetaIonicModel, key: PropertyKey, newValue: any, oldValue: any) {
   if (structureConfigs[0].structure === Object) return;
   for (const config of structureConfigs) {
      const afterSet = config.afterSet
      if (afterSet) afterSet(ionicModel, meta, key, newValue, oldValue)
   }
}


function getNonTrackableKeys(structureKey: any) {
   return ionicStructureMap.get(structureKey)?.nontrackableKeys
}


export function isNonTrackable(key: PropertyKey, structureConfigs: CustomIonicModelConfig[]) {
   for (const config of structureConfigs) {
      const nontrackableKeys = config.nontrackableKeys
      if (nontrackableKeys && key in nontrackableKeys) return true;
      if (typeof key === 'symbol' && key.description && nontrackableKeys && key.description in nontrackableKeys) return true;
   }
   return false;
}


export function createCustomIonicModel(
   structureConfigs: CustomIonicModelConfig[],
   target: AnyObject,
   methods: AnyObject | undefined,
   exposeAllMethods: boolean
) {
   const metaIonicModel = new MetaIonicModel(target, methods, exposeAllMethods || methods || false)
   const ionicModel = new Proxy(target, {
      get(target, key, receiver) {
         if (__DEV__) emitSignal()
         if (key === META) return metaIonicModel
         const protectedMeta = getProtectedModelMeta(target, ionicModel, receiver)
         if (protectedMeta) {
            const keys = protectedMeta.propertyKeys
            if (keys && !(key in keys)) {
               if (__DEV__) console.warn(`Object is protected. Cannot access '${key.toString()}'`)
               return undefined;
            }
         }

         if (methods && key in methods) {
            const method = methods[key]
            if (method instanceof Function){
               return accessMethod(
                  target,
                  ionicModel,
                  receiver,
                  key,
                  boundMethodMap,
                  method
               )
            }
         }
         const _key = typeof key === 'string' && key.startsWith('_') ? key.slice(1) : key;
         if (isNativeMethod(_key, structureConfigs)) {
            if (protectedMeta) {
               const keys = protectedMeta.propertyKeys
               if (keys && _key in keys) {
                  return getNativeMethod(
                     _key,
                     structureConfigs,
                     target,
                     ionicModel,
                     metaIonicModel,
                     boundMethodMap,
                  )
               }
               return undefined;
            }
            else {
               return getNativeMethod(
                  _key,
                  structureConfigs,
                  target,
                  ionicModel,
                  metaIonicModel,
                  boundMethodMap,
               )
            }
         }
         const value = Reflect.get(target, key, receiver)
         // if (typeof key === 'symbol' && key.description === 'Symbol.iterator') { //TODO: make this part of isNonTrackable?
         //     return value;
         // }
         if (isNonTrackable(key, structureConfigs))
            return value;

         const isIonAccessKey = typeof key === 'string' && key[0] === '$'
         if (isIonAccessKey) {
            if (isIon(value))
               return value; // { $count: $count } get ion case
            if (value === undefined) {
               const _key = key.slice(1);
               const _value = Reflect.get(target, _key, receiver);
               if (isIon(_value))
                  return _value;  // { count: $count } get ion case
            }
            return asPropIon(ionicModel, _key) // { count: 0}  and { $count: 0 } get ion case
         }

         if (isIon(value)) {
            return maybeIonize(value(), target, ionicModel, receiver); // { count: $count } get value case
         }

         if (value instanceof Function)
            return accessMethod(
               target,
               ionicModel,
               receiver,
               typeof _key === 'string' ? '_' + _key : key,
               boundMethodMap,
               value
            )
         const _value = maybeIonize(value, target, ionicModel, receiver)
         const tracker = getActiveTracker()
         if (!tracker || Reflect.getOwnPropertyDescriptor(target, key)?.writable === false)
            return _value;
         tracker.track(asTrackedProp(ionicModel, key))
         return _value;
      },
      set(target, key, value, receiver) {
         return reactiveSetter(
            structureConfigs,
            ionicModel,
            metaIonicModel,
            target,
            key,
            value,
            receiver
         )
      }
   }) as IonizedModel

   const boundMethodMap = new Map()

   metaIonicModel.initIonicModel(ionicModel)
   registerIonizedModel(ionicModel, target)
   return ionicModel
}

function maybeIonize(value: any, target: AnyObject, proxy: AnyObject, receiver: AnyObject) {
   if (!(value instanceof Object))
      return value;
   if (isReadonlyProxy(target, proxy, receiver)) {
      return protect(ionize(value), READONLY)
   }
   const protectedMeta = getProtectedModelMeta(target, proxy, receiver)
   if (protectedMeta) {
      return protect(ionize(value))
   }
   return ionize(value)
}

function isNativeMethod(key: PropertyKey, structureConfigs: CustomIonicModelConfig[]) {
   for (const structure of structureConfigs) {
      const mutatingOps = structure.mutatingOps
      if (mutatingOps && key in mutatingOps)
         return true;
      const trackableOps = structure.mutatingOps
      if (trackableOps && key in trackableOps)
         return true;
   }
   return false;
}





export function accessMethod(
   target: AnyObject,
   proxy: AnyObject,
   receiver: AnyObject,
   key: PropertyKey,
   boundMethodMap: Map<PropertyKey, Function>,
   method?: Function
) {
   if (isReadonlyProxy(target, proxy, receiver)) {
      if (__DEV__) console.warn('Object is readonly. Cannot access methods')
      return undefined;
   }

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
      boundMethod = method.bind(proxy);
      boundMethodMap.set(key, boundMethod!)
      return boundMethod;
   }
   throw new Error('No method provided')
}

function getNativeMethod(
   key: string | symbol,
   structureConfigs: CustomIonicModelConfig[],
   target: AnyObject,
   ionicModel: IonizedModel,
   meta: MetaIonicModel,
   boundMethodMap: Map<PropertyKey, Function>,
) {
   const _key = typeof key === 'string' ? '_' + key : key
   let boundMethod = boundMethodMap.get(_key)
   if (boundMethod) return boundMethod;

   for (const config of structureConfigs) {
      const mutatingOps = config.mutatingOps
      if (mutatingOps && key in mutatingOps) {
         const createOp = mutatingOps[key].createOp
         const getPreopData = mutatingOps[key].preop
         const op = createOp(target, ionicModel, meta, getPreopData)
         boundMethodMap.set(_key, op)
         return op;
      }
      const trackableOps = config.trackableOps
      if (trackableOps && key in trackableOps) {
         const createOp = trackableOps[key]
         const op = createOp(target, ionicModel)
         boundMethodMap.set(_key, op)
         return op;
      }
   }
}






export function reactiveSetter(
   structureConfigs: CustomIonicModelConfig[], // and Tuple
   ionicModel: IonizedModel,
   metaIonicModel: MetaIonicModel,
   target: AnyObject,
   key: string | symbol,
   newValue: any,
   receiver: AnyObject
) {
   if (isProtectedProxy(target, ionicModel, receiver)) {
      if (__DEV__) console.warn('Set operation failed. Property is readonly')
      return false;
   }
   if (metaIonicModel.isNewProperty(key)) metaIonicModel.registerNewProperty(key)

   const oldValue = Reflect.get(target, key, receiver);
   if (isIon(oldValue) && !isIon(newValue)) {
      return setAbsorbedIon(oldValue, newValue, ionicModel, key, oldValue(), structureConfigs)
   }
   if (oldValue === newValue
      || isNonTrackable(key, structureConfigs)
      || !isWritable(target, key)) {
      target[key] = newValue
      return true;
   }

   const _newValue = toRaw(isIon(newValue) ? newValue() : newValue)
   const _oldValue = isIon(oldValue) ? oldValue() : oldValue

   target[key] = isIon(newValue) ? newValue : _newValue

   storeSnapshot(metaIonicModel)

   const prop = getObservedProp(ionicModel, key);
   if (prop) {
      trigger(prop, _newValue, _oldValue)
   }

   emitAfterSet(structureConfigs, ionicModel, metaIonicModel, key, _newValue, _oldValue)

   triggerIonicModel(
      ionicModel,
      '[[set]]',
      [key, _newValue],
      _newValue,
      _oldValue,
   )

   return true;
}



export function setAbsorbedIon(ion: AnyIon, value: any, ionicModel: IonizedModel, key: PropertyKey, oldValue: any, structureConfigs: CustomIonicModelConfig[]) {
   if ('as' in ion) {
      ion.as(value);

      const prop = getObservedProp(ionicModel, key);
      if (prop) {
         trigger(prop, value, oldValue)
      }

      emitAfterSet(structureConfigs, ionicModel, asMetaIonicModel(ionicModel), key, value, oldValue)

      triggerIonicModel(
         ionicModel,
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