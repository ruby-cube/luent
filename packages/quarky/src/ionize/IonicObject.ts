import { AnyObject } from "@rue/types";
import { createReactiveTraps, isNonTrackable, isIonicModel, IonicModel, reactiveSetter, toRaw, ionize, registerIonicModel } from "./IonicModel";
import { META } from "../ReactiveEntity";
import { emitSignal } from "../debug";
import { getActiveTracker } from "../derivations/DependencyTracker";
import { asObservedProp } from "./ObservedProp";
import { MetaIonicModel, IONIC_MODEL } from "./MetaIonicModel";
import { isIon } from "../ion/ReactiveIon";
import { isAnyIon } from "../ion/AnyIon";
import { getProtectedModelValue, isReadonlyProxy } from "./ProtectedIonicModel";

export function isReactiveObject(value: any): value is IonicModel {
    if (!isIonicModel(value)) return false;
    const raw = toRaw(value);
    if (raw instanceof Map || raw instanceof Array || raw instanceof Set || raw instanceof Function) return false;
    return true;
}

export function accessMethod(
    method: Function,
    target: AnyObject,
    proxy: AnyObject,
    receiver: AnyObject,
    key: PropertyKey
){
    if (isReadonlyProxy(target, proxy, receiver)) {
        if (__DEV__) console.warn('Object is readonly. Cannot access methods')
        return undefined;
    }
    const keys = getProtectedModelValue(target, proxy, receiver)
    if (keys instanceof Object && !(key in keys)) {
        if (__DEV__) console.warn(`Object is protected. Cannot access '${key.toString()}' method`)
        return undefined;
    }
    return method.bind(proxy);
}


export function createIonicObject(
    target: AnyObject,
    methods: AnyObject | undefined
) {
    const metaIonicModel = new MetaIonicModel(target, methods)
    const reactive = new Proxy(target, {
        get(target, key, receiver) {
            if (__DEV__) emitSignal();
            if (key === META) return metaIonicModel;
            if (methods && key in methods) {
                return accessMethod(
                    methods[key],
                    target,
                    reactive,
                    receiver,
                    key
                )
            }
            const value = Reflect.get(target, key, receiver);
            if (isNonTrackable(key, Object)) return value;
            if (isAnyIon(value)) return value();
            if (value instanceof Function) {
                return accessMethod(
                    value,
                    target,
                    reactive,
                    receiver,
                    key
                )
            }
            const _value = value instanceof Object ? ionize(value) : value
            const tracker = getActiveTracker();
            if (!tracker || Reflect.getOwnPropertyDescriptor(target, key)?.writable === false
            ) {
                // if (isAnyIon(value)) return value();
                return _value;
            }
            tracker.track(asObservedProp(reactive, key));
            return _value;
        },
        set(target, key, value, receiver) {
            return reactiveSetter(
                Object,
                reactive,
                metaIonicModel!,
                target,
                key,
                value,
                receiver
            )
        }
    }) as IonicModel<AnyObject>

    metaIonicModel.initIonicModel(reactive)
    registerIonicModel(reactive, target)
    return reactive
}




