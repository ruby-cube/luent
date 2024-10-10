import { AnyObject } from "@rue/types";
import { isNonTrackable, isIonicModel, IonicModel, reactiveSetter, toRaw, ionize, registerIonicModel } from "./IonicModel";
import { META } from "../ReactiveEntity";
import { emitSignal } from "../debug";
import { getActiveTracker } from "../derivations/DependencyTracker";
import { MetaIonicModel, IONIC_MODEL } from "./MetaIonicModel";
import { isAnyIon } from "../ion/AnyIon";
import { getProtectedModelMeta, isProtectedProxy, isReadonlyProxy } from "./ProtectedIonicModel";
import { protect } from "../protect";
import { READONLY } from "../ion/ProtectedIon";
import { asTrackedProp } from "./PropIon";

export function isIonicObject(value: any): value is IonicModel {
    if (!isIonicModel(value)) return false;
    const raw = toRaw(value);
    if (raw instanceof Map || raw instanceof Array || raw instanceof Set || raw instanceof Function) return false;
    return true;
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


export function createIonicObject(
    target: AnyObject,
    methods: AnyObject | undefined
) {
    const boundMethodMap: Map<string | symbol, Function> = new Map()
    const metaIonicModel = new MetaIonicModel(target, methods)
    const ionicModel = new Proxy(target, {
        get(target, key, receiver) {
            if (__DEV__) emitSignal();
            if (key === META) return metaIonicModel;
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
            const value = Reflect.get(target, key, receiver);
            if (isNonTrackable(key, Object)) return value;
            if (isAnyIon(value)) return value();
            if (value instanceof Function) {
                return accessMethod(
                    target,
                    ionicModel,
                    receiver,
                    key,
                    boundMethodMap,
                    value
                )
            }
            const _value = maybeIonize(value, target, ionicModel, receiver)
            const tracker = getActiveTracker();
            if (!tracker || Reflect.getOwnPropertyDescriptor(target, key)?.writable === false
            ) {
                // if (isAnyIon(value)) return value();
                return _value;
            }
            tracker.track(asTrackedProp(ionicModel, key));
            return _value;
        },
        set(target, key, value, receiver) {
            return reactiveSetter(
                Object,
                ionicModel,
                metaIonicModel!,
                target,
                key,
                value,
                receiver
            )
        }
    }) as IonicModel<AnyObject>

    metaIonicModel.initIonicModel(ionicModel)
    registerIonicModel(ionicModel, target)
    return ionicModel
}




export function maybeIonize(value: any, target: AnyObject, proxy: AnyObject, receiver: AnyObject) {
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