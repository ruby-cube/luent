import { AnyObject } from "@rue/types";
import { asDeepReactive, asShallowReactive, createReactiveTraps, DEEP, isNonTrackable, isReactiveModel, maybeAsDeepReactive, ReactiveModel, reactiveSetter, ReactiveTraps, registerReactive, toRaw } from "./ReactiveModel";
import { META } from "../ReactiveEntity";
import { emitSignal } from "../debug";
import { getActiveTracker } from "../derivations/DependencyTracker";
import { asObservedProp } from "./ObservedProp";
import { MetaReactiveModel, REACTIVE_MODEL } from "./MetaReactiveModel";

export function isReactiveObject(value: any): value is ReactiveModel {
    if (!isReactiveModel(value)) return false;
    const raw = toRaw(value);
    if (raw instanceof Map || raw instanceof Array || raw instanceof Set || raw instanceof Function) return false;
    return true;
}



export function createReactiveObject(
    target: AnyObject,
    deep: boolean = false,
    existingMeta?: MetaReactiveModel
) {
    const traps = createReactiveTraps(
        target,
        function get(target, key) {
            if (__DEV__) emitSignal();
            if (key === META) return metaReactive;
            if (key === '_$' && deep) return asShallowReactive(target);
            const value = Reflect.get(target, key);
            if (isNonTrackable(key, Object)) return value;
            if (value instanceof Function) return value.bind(reactive)
            const _value = maybeAsDeepReactive(value, deep)
            const tracker = getActiveTracker();
            if (!tracker || Reflect.getOwnPropertyDescriptor(target, key)?.writable === false
            ) {
                return _value;
            }
            tracker.track(asObservedProp(reactive, key));
            return _value;
        },
        function set(target, key, value, receiver) {
            return reactiveSetter(
                Object,
                reactive,
                metaReactive!,
                target,
                key,
                value,
                receiver
            )
        },
        existingMeta?.traps
    )

    const metaReactive = existingMeta || new MetaReactiveModel(target, traps)
    const reactive = new Proxy(target, traps) as ReactiveModel<AnyObject>

    return registerReactive(
        target,
        reactive,
        metaReactive,
        deep
    )
}




