import { AnyObject } from "@rue/types";
import { isReactiveAtom } from "../derivations/ReactiveAtom";
import { META } from "../ReactiveEntity";
import { trigger, triggerReactiveAtom } from "../trigger";
import { asObservedProp, getObservedProp } from "./ObservedProp";
import { asDeepReactive, asShallowReactive, createReactive, createReactiveTraps, DEEP, isNonTrackable, isReactiveModel, maybeAsDeepReactive, maybeUnreactivize, ReactiveModel, registerReactive, storeSnapshot, toRaw, triggerReactiveWithSetOp } from "./ReactiveModel";
import { asTrackedOp, getTrackedOp } from "./TrackedOp";
import { maybeUnreactivizeArgs, triggerReactiveWithMutationOp, useGetOp } from "./ReactiveCapsule";
import { emitSignal } from "../debug";
import { isMutatingArrayMethod } from "@rue/utils";
import { getActiveTracker } from "../derivations/DependencyTracker";
import { Collection, MetaReactiveCollection, MetaReactiveModel } from "./MetaReactiveModel";

export function createReactiveArray(
    target: any[],
    deep: boolean = false,
    existingMeta?: MetaReactiveCollection<any[]>
) {
    const traps = createReactiveTraps(target,
        function get(target, key, receiver) {
            console.log("getting", key)
            return reactiveArrayGetter(
                reactive,
                metaReactive,
                deep,
                function handleMutatingMethod(key: string, fn) {
                    return (...args: any[]) => {
                        return mutatingArrayOp(
                            args,
                            reactive,
                            metaReactive,
                            target,
                            key,
                            fn
                        )
                    }
                },
                <any[]>target,
                key,
                receiver
            )
        },
        function set(target, key, value, receiver) {
            console.log("setting", key, "to", value)
            return reactiveArraySetter(
                reactive,
                metaReactive,
                target,
                key,
                value,
                receiver
            )
        }
    )
    const metaReactive = existingMeta || new MetaReactiveCollection(target, traps)
    const reactive = new Proxy(target, traps) as ReactiveModel<any[]>

    return registerReactive(
        target,
        reactive,
        metaReactive,
        deep
    )
}


export function createReactiveTuple<T extends any[]>(
    target: T,
    deep: boolean = false,
    existingMeta?: MetaReactiveCollection<T>
) {

    const traps = createReactiveTraps(target,
        function get(target, key, receiver) {
            return reactiveArrayGetter(
                reactive,
                metaReactive,
                deep,
                function handleMutatingMethod() {
                    throw new Error("Tuples can only be mutated by index")
                },
                <any[]>target,
                key,
                receiver
            )
        },
        function set(target, key, value, receiver) {
            return reactiveArraySetter(
                reactive,
                metaReactive,
                target,
                key,
                value,
                receiver
            )
        }
    )

    const metaReactive = existingMeta || new MetaReactiveCollection(target, traps)
    const reactive = new Proxy(target, traps) as ReactiveModel<any[]>

    return registerReactive(
        target,
        reactive,
        metaReactive,
        deep
    )
}

// export function createReactiveArrayItems(
//     target: any[],
// ) {
//     for (let i = 0; i < target.length; i++) {
//         const item = target[i]
//         if (isReactiveModel(item)) continue;
//         if (!(item instanceof Object)) continue;
//         const item$ = createReactive(item, DEEP)
//         if (item$ === null) continue;
//         target[i] = item$;
//     }
// }


function reactiveArrayGetter(
    reactive: ReactiveModel<Collection>,
    metaReactive: MetaReactiveCollection,
    deep: boolean,
    handleMutatingMethod: (key: string, fn: Function) => (...args: any[]) => any,
    target: any[],
    key: string | symbol,
    receiver: AnyObject
) {
    if (__DEV__) emitSignal();
    if (key === META) return metaReactive;
    if (key === '_$' && deep) return asShallowReactive(target);
    const value = Reflect.get(target, key, receiver);
    if (typeof key === 'symbol' && key.description === 'Symbol.iterator') {
        return value;
    }
    if (isNonTrackable(key, Array)) return value;
    if (isMutatingArrayMethod(key)) {
        return handleMutatingMethod(<string>key, value);
    }
    if (key === 'at') {
        return useGetOp(
            reactive,
            target,
            key,
            value
        )
    }
    
    const _value = maybeAsDeepReactive(value, deep)
    const tracker = getActiveTracker()
    if (!tracker) return _value;

    tracker.track(asObservedProp(reactive, key))
    return _value;
}



function reactiveArraySetter(
    reactive: ReactiveModel,
    metaReactive: MetaReactiveCollection,
    target: AnyObject,
    key: string | symbol,
    newValue: any,
    receiver: AnyObject
) {
    const _newValue = maybeUnreactivize(newValue)
    const op = target instanceof Array && isIntegerKey(key) ? getTrackedOp(reactive, 'at', key) : null;
    const prop = getObservedProp(reactive, key);
    if (!prop && !op) {
        // Reflect.set(target, key, newValue, receiver);
        target[key] = _newValue
        return true;
    }
    const oldValue = Reflect.get(target, key, receiver);
    if (oldValue === _newValue || isNonTrackable(key, Array)) {
        // Reflect.set(target, key, newValue, receiver);
        target[key] = _newValue
        return true;
    }


    // Reflect.set(target, key, _newValue, receiver);
    target[key] = _newValue

    storeSnapshot(metaReactive)

    if (prop) {
        trigger(prop)
    }

    if (op) {
        triggerReactiveAtom(op)
    }

    const trackedIndices = metaReactive.observedEntryKeys
    if (trackedIndices && key === 'length') {
        for (const indexKey of trackedIndices) {
            if (typeof indexKey !== 'string') {
                console.warn(`index key is not string. May need to refactor code`)
                continue;
            }
            const index = parseInt(indexKey)
            if (index > _newValue || index > oldValue) {
                const prop = getObservedProp(reactive, indexKey)
                if (prop) {
                    trigger(prop)
                }
                const op = getTrackedOp(reactive, 'at', index)
                if (op) {
                    if (isReactiveAtom(op)) {
                        triggerReactiveAtom(op)
                    }
                }
            }
        }
    }

    triggerReactiveWithSetOp(
        reactive,
        key,
        _newValue,
        oldValue,
    )
    return true;
}

export function isIntegerKey(key: unknown) {
    const keyAsNumber = Number(key);
    if (isNaN(keyAsNumber)) return false;
    if (Number.isInteger(keyAsNumber)) return true
}




function mutatingArrayOp(
    args: any[],
    reactive: ReactiveModel<any[]>,
    metaReactive: MetaReactiveModel<any[]>,
    target: AnyObject,
    key: string,
    fn: Function
) {
    const _args = maybeUnreactivizeArgs(key, args);
    const oldLength = target.length;
    const output = fn.apply(reactive, _args); // perform mutation
    const newLength = target.length;

    if (oldLength === newLength) return output; //FIX: Some methods will mutate but not change the length, like fill
    storeSnapshot(metaReactive)

    const lengthProp = getObservedProp(reactive, 'length')
    if (lengthProp) {
        trigger(lengthProp); // trigger for length change
    }

    if (key === 'pop') {
        const prop = getObservedProp(reactive, (oldLength - 1).toString())
        if (prop) trigger(prop);
        const op = getTrackedOp(reactive, 'at', - 1)
        if (op) triggerReactiveAtom(op);
    }

    triggerReactiveWithMutationOp(
        reactive,
        key,
        _args,
        output
    )

    return output;
}



export function isReactiveArray(target: any): target is ReactiveModel<any[]> {
    if (!isReactiveModel(target)) return false;
    if (toRaw(target) instanceof Array) return true;
    return false;
}