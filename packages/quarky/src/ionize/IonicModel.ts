import { AnyObject } from "@rue/types";
import { asMetaIonicModel, ionize, registerIonicModel, toRaw } from "./ionize";
import { emitSignal } from "../debug";
import { getActiveTracker } from "../derivations/DependencyTracker";
import { asTrackedOp, getTrackedOp } from "./TrackedOp";
import { IonicModel, storeSnapshot } from "./ionize";
import { trigger, triggerIonicAtom, triggerIonicModel } from "../trigger";
import {  MetaIonicModel } from "./MetaIonicModel";
import { noop } from "@rue/utils";
import { getProtectedModelMeta, isProtectedProxy, isReadonlyProxy } from "./ProtectedIonicModel";
import { META } from "../ReactiveEntity";
import { AnyIon, isAnyIon } from "../ion/AnyIon";
import { asTrackedProp, getObservedProp, registerEntryKeyValidator } from "./PropIon";
import { protect } from "../protect";
import { READONLY } from "../ion/ProtectedIon";

export const UNDEFINED_OP: Function = noop


// A 'get op' is a o(1) get-like operation like set.has() or array.at()
export function useTrackableGetOp(
    reactive: IonicModel,
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
export function useTrackableOp(){
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





//API
export function defineIonicStructure(structureKey: any, config: CustomIonicModelConfig) {
    config.structure = structureKey;
    const { isEntryKey } = config
    if (isEntryKey) {
        registerEntryKeyValidator(isEntryKey)
    }

    customIonicStructureMap.set(structureKey, config)
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
    const config = customIonicStructureMap.get(constructor)
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

type BeforeSetCallback = (ionicModel: IonicModel, meta: MetaIonicModel, key: PropertyKey, oldValue: any) => void
type AfterSetCallback = (ionicModel: IonicModel, meta: MetaIonicModel, key: PropertyKey, newValue: any, oldValue: any) => void

type CreateTrackableOp = (target: AnyObject, ionicModel: IonicModel<AnyObject>) => (...args: any[]) => any

type MutatingOpConfig = {
    createOp: (target: AnyObject, ionicModel: IonicModel<AnyObject>, meta: any, getPreopData: GetPreopData | undefined) => (...args: any[]) => any
    preop?: GetPreopData
    revert?: Revert
}

export type GetPreopData = (model: AnyObject, args?: any[]) => any;
type Revert = (model: AnyObject, data: { output: any, preopData: any, args: any[] }) => void

const customIonicStructureMap: Map<any, CustomIonicModelConfig> = new Map();

function isCustomIonicStructure(value: any) {
    return customIonicStructureMap.has(value);
}

// function getMutatingOps(DataStructure: any) {
//     const config = customIonicStructureMap.get(DataStructure)
//     if (!config) throw new Error(`Cannot find config for this data structure: ${DataStructure.toString()}`)
//     return config.mutatingOps
// }

function emitAfterSet(structureConfigs: CustomIonicModelConfig[], ionicModel: IonicModel, meta: MetaIonicModel, key: PropertyKey, newValue: any, oldValue: any) {
    if (structureConfigs[0].structure === Object) return;
    for (const config of structureConfigs) {
        const afterSet = config.afterSet
        if (afterSet) afterSet(ionicModel, meta, key, newValue, oldValue)
    }
}


function getNonTrackableKeys(structureKey: any) {
    return customIonicStructureMap.get(structureKey)?.nontrackableKeys
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
    methods: AnyObject | undefined
) {
    const metaIonicModel = new MetaIonicModel(target, methods)

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
                return accessMethod(
                    target,
                    ionicModel,
                    receiver,
                    key,
                    boundMethodMap,
                    methods[key]
                )
            }
            if (isMutatingOps(key, structureConfigs)) {
                if (protectedMeta) {
                    const keys = protectedMeta.propertyKeys
                    if (keys && key in keys) {
                        return accessMethod(
                            target,
                            ionicModel,
                            receiver,
                            key,
                            boundMethodMap
                        )
                    }
                    return undefined;
                }
            }

            const value = Reflect.get(target, key, receiver)
            // if (typeof key === 'symbol' && key.description === 'Symbol.iterator') { //TODO: make this part of isNonTrackable?
            //     return value;
            // }
            if (isNonTrackable(key, structureConfigs))
                return value;
            if (isAnyIon(value)) return value();

            if (value instanceof Function)
                return accessMethod(
                    target,
                    ionicModel,
                    receiver,
                    key,
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
    }) as IonicModel<Map<any, any>>

    const boundMethodMap = createBoundMethodMap(structureConfigs, target, ionicModel, metaIonicModel)

    metaIonicModel.initIonicModel(ionicModel)
    registerIonicModel(ionicModel, target)
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

function isMutatingOps(key: PropertyKey, structureKeys: any[]) {
    for (const structure in structureKeys) {
        const mutatingOps = customIonicStructureMap.get(structure)?.mutatingOps
        if (!mutatingOps) continue;
        if (key in mutatingOps) return true;
    }
    return false;
}


function createBoundMethodMap(structureKeys: any[], target: AnyObject, ionicModel: IonicModel, meta: MetaIonicModel ) {

    const methodMap = new Map()

    for (const key in structureKeys) {
        const mutatingOps = customIonicStructureMap.get(key)?.mutatingOps
        if (!mutatingOps) continue;
        for (const opKey in mutatingOps) {
            const createOp = mutatingOps[opKey].createOp
            const getPreopData = mutatingOps[opKey].preop
            methodMap.set(opKey, createOp(target, ionicModel, meta, getPreopData)) //TODO: should I create these lazily?
        }
    }

    for (const key in structureKeys) {
        const trackableOps = customIonicStructureMap.get(key)?.trackableOps
        if (!trackableOps) continue;
        for (const opKey in trackableOps) {
            const createOp = trackableOps[opKey]
            methodMap.set(opKey, createOp(target, ionicModel))
        }
    }

    return methodMap;
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




export function reactiveSetter(
    structureConfigs: CustomIonicModelConfig[], // and Tuple
    ionicModel: IonicModel,
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
    if (isAnyIon(oldValue) && !isAnyIon(newValue)) {
        return setAbsorbedIon(oldValue, newValue, ionicModel, key, oldValue(), structureConfigs)
    }
    if (oldValue === newValue
        || isNonTrackable(key, structureConfigs)
        || !isWritable(target, key)) {
        target[key] = newValue
        return true;
    }

    const _newValue = toRaw(isAnyIon(newValue) ? newValue() : newValue)
    const _oldValue = isAnyIon(oldValue) ? oldValue() : oldValue

    target[key] = isAnyIon(newValue) ? newValue : _newValue

    storeSnapshot(metaIonicModel)

    const prop = getObservedProp(ionicModel, key);
    if (prop) {
        trigger(prop, _newValue, _oldValue)
    }

    emitAfterSet(structureConfigs, ionicModel, metaIonicModel, key, _newValue, _oldValue)

    triggerIonicModel(
        ionicModel,
        with_op = '[[set]]',
        with_args = [key, _newValue],
        with_output = _newValue,
        with_preopData = _oldValue,
    )

    return true;
}

// function getTrackedOp(ionicModel: IonicModel, key: PropertyKey, structureConfigs: any[]) {
//     for (const structures of structureConfigs) {
//         const trackableOps = customIonicStructureMap.get(structures)?.trackableOps
//         if (trackableOps) {

//         }
//     }
// }

export function setAbsorbedIon(ion: AnyIon, value: any, ionicModel: IonicModel, key: PropertyKey, oldValue: any, structureConfigs: CustomIonicModelConfig[]) {
    if ('set' in ion) {
        ion.set(value);

        const prop = getObservedProp(ionicModel, key);
        if (prop) {
            trigger(prop, value, oldValue)
        }

        emitAfterSet(structureConfigs, ionicModel, asMetaIonicModel(ionicModel), key, value, oldValue)

        triggerIonicModel(
            ionicModel,
            with_op = '[[set]]',
            with_args = [key, value],
            with_output = value,
            with_preopData = oldValue,
        )
        return true;
    }
    if (__DEV__) throw new Error("Absorbed Ion is read only")
    return false;
}


function isWritable(target: Object, key: PropertyKey) {
    const descriptor = Reflect.getOwnPropertyDescriptor(target, key);
    if (descriptor?.writable === true) return true;
    return false;
}