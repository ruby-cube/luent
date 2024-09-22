import { AnyObject } from "@rue/types";
import { createReactiveTraps, isNonTrackable, isIonicModel, IonicModel, reactiveSetter,  toRaw, ionize, registerIonicModel } from "./IonicModel";
import { META } from "../ReactiveEntity";
import { emitSignal } from "../debug";
import { getActiveTracker } from "../derivations/DependencyTracker";
import { asObservedProp } from "./ObservedProp";
import { MetaIonicModel, IONIC_MODEL } from "./MetaIonicModel";

export function isReactiveObject(value: any): value is IonicModel {
    if (!isIonicModel(value)) return false;
    const raw = toRaw(value);
    if (raw instanceof Map || raw instanceof Array || raw instanceof Set || raw instanceof Function) return false;
    return true;
}



export function createIonicObject(
    target: AnyObject,
) {
    const metaIonicModel = new MetaIonicModel(target)
    const reactive = new Proxy(target, {
        get(target, key) {
            if (__DEV__) emitSignal();
            if (key === META) return metaIonicModel;
            // if (key === '_$' && deep) return asShallowReactive(target);
            const value = Reflect.get(target, key);
            if (isNonTrackable(key, Object)) return value;
            if (value instanceof Function) return value.bind(reactive)
            const _value = value instanceof Object ? ionize(value) : value
            const tracker = getActiveTracker();
            if (!tracker || Reflect.getOwnPropertyDescriptor(target, key)?.writable === false
            ) {
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




