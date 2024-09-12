import { AnyObject } from "@rue/types";
import { isReactiveAtom } from "../derivations/ReactiveAtom";
import { META } from "../ReactiveEntity";
import { trigger, triggerReactiveAtom } from "../trigger";
import { asObservedProp } from "./ObservedProp";
import { createReactive, DEEP, isNonTrackable, isReactiveModel, maybeReactivize, ReactiveModel, ReactiveModelContainer, storeSnapshot, toRaw, triggerReactiveWithSetOp, useForwardingHandlers } from "./Reactive$";
import { MetaReactiveCollection } from "./ReactiveCollection";
import { asTrackedOp } from "./TrackedOp";
import { maybeReactivizeArgs, triggerReactiveWithMutationOp, useGetOp } from "./ReactiveCapsule";
import { MetaReactiveModel } from "./ReactiveModel";
import { emitSignal } from "../debug";
import { isMutatingArrayMethod } from "@rue/utils";
import { getActiveTracker } from "../derivations/DependencyTracker";

export function createReactiveArray(
    target: any[],
    deep: boolean = false
) {
    // const array = target as any[] & { [TRACKED_INDICES]: Set<number> | undefined }
    let sampleValue: any;

    const container = new ReactiveModelContainer(target, deep)
    const metaReactive = container[META]

    const reactive = new Proxy(container, {
        get: (_, key, receiver) =>
            reactiveArrayGetter(
                metaReactive,
                function handleMutatingMethod(key: string, fn) {
                    return (...args: any[]) => {
                        return mutatingArrayOp(
                            args,
                            metaReactive,
                            target,
                            sampleValue,
                            key,
                            fn
                        )
                    }
                },
                target,
                key,
                receiver
            ),
        set: (_, key, value, receiver) =>
            reactiveArraySetter(
                metaReactive,
                target,
                key,
                value,
                receiver
            )
        ,
        getPrototypeOf() {
            return Reflect.getPrototypeOf(target)
        },
        has(_: unknown, key: PropertyKey) {
            return Reflect.has(target, key)
        },
        deleteProperty(_: unknown, key: any) {
            return Reflect.deleteProperty(target, key)
        },
        ownKeys() {
            return Reflect.ownKeys(target)
        },
        setPrototypeOf(_: unknown, proto: ReactiveModelContainer | null) {
            return Reflect.setPrototypeOf(target, proto)
        },
        isExtensible() {
            return Reflect.isExtensible(target)
        },
        preventExtensions() {
            return Reflect.preventExtensions(target)
        },
        getOwnPropertyDescriptor(_: unknown, key: PropertyKey) {
            return Reflect.getOwnPropertyDescriptor(target, key)
        },
        defineProperty(_: unknown, key: PropertyKey, attributes: PropertyDescriptor & ThisType<any>) {
            return Reflect.defineProperty(target, key, attributes)
        }
    })
    sampleValue = target[0];
    metaReactive.initReactiveModel(reactive)

    if (deep) {
        createReactiveArrayItems(target)
    }
    return reactive;
}


export function createReactiveTuple(
    target: any[],
    deep: boolean = false
) {

    const container = new ReactiveModelContainer(target, deep)
    const metaReactive = container[META]
    const reactive = new Proxy(container, {
        get: (_, key, receiver) =>
            reactiveArrayGetter(
                metaReactive,
                function handleMutatingMethod() {
                    throw new Error("Tuples can only be mutated by index")
                },
                target,
                key,
                receiver
            ),
        set: (_, key, value, receiver) =>
            reactiveArraySetter(
                metaReactive,
                target,
                key,
                value,
                receiver
            )
    })
    metaReactive.initReactiveModel(reactive)

    if (deep) {
        createReactiveArrayItems(target)
    }
    return reactive;
}

export function createReactiveArrayItems(
    target: any[],
) {
    for (let i = 0; i < target.length; i++) {
        const item = target[i]
        if (isReactiveModel(item)) continue;
        if (!(item instanceof Object)) continue;
        const item$ = createReactive(item, DEEP)
        if (item$ === null) continue;
        target[i] = item$;
    }
}


function reactiveArrayGetter(
    metaReactive: MetaReactiveCollection,
    handleMutatingMethod: (key: string, fn: Function) => (...args: any[]) => any,
    target: any[],
    key: string | symbol,
    receiver: any[]
) {
    if (__DEV__) emitSignal();
    if (key === META) return metaReactive;
    const value = Reflect.get(target, key, receiver);
    if (typeof key === 'symbol' && key.description === 'Symbol.iterator') {
        return value;
    }
    if (isMutatingArrayMethod(key)) {
        return handleMutatingMethod(<string>key, value);
    }
    if (key === 'at') {
        return useGetOp(
            metaReactive,
            target,
            key,
            value
        )
    }

    const tracker = getActiveTracker()
    if (!tracker || isNonTrackable(key, Array)) return value;

    const reactive = metaReactive.o
    tracker.track(asObservedProp(reactive, key))
    return value;
}



function reactiveArraySetter(
    metaReactive: MetaReactiveCollection,
    target: AnyObject,
    key: string | symbol,
    newValue: any,
    receiver: AnyObject
) {
    const reactive = metaReactive.o
    const op = target instanceof Array && isIntegerKey(key) ? asTrackedOp(reactive, 'at', key) : null;
    const prop = asObservedProp(reactive, key);
    if (!prop && !op) {
        Reflect.set(target, key, newValue, receiver);
        return true;
    }
    const oldValue = Reflect.get(target, key, receiver);
    if (oldValue === newValue || isNonTrackable(key, Array)) {
        Reflect.set(target, key, newValue, receiver);
        return true;
    }

    const _newValue = maybeReactivize(newValue, metaReactive, oldValue)

    Reflect.set(target, key, _newValue, receiver);

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
                const prop = asObservedProp(reactive, indexKey)
                if (prop) {
                    trigger(prop)
                }
                const op = asTrackedOp(reactive, 'at', index)
                if (op) {
                    if (isReactiveAtom(op)) {
                        triggerReactiveAtom(op)
                    }
                }
            }
        }
    }

    triggerReactiveWithSetOp(
        metaReactive.o,
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
    metaReactive: MetaReactiveModel<any[]>,
    target: AnyObject,
    sampleValue: any,
    key: string,
    fn: Function
) {
    const reactive = metaReactive.o
    const _args = maybeReactivizeArgs(key, args, metaReactive, sampleValue);
    const oldLength = target.length;
    const output = fn.apply(target, _args); // perform mutation
    const newLength = target.length;

    if (oldLength === newLength) return output; //FIX: Some methods will mutate but not change the length, like fill


    storeSnapshot(metaReactive)

    const lengthProp = asObservedProp(reactive, 'length')
    if (lengthProp) {
        trigger(lengthProp); // trigger for length change
    }

    if (key === 'pop') {
        const prop = asObservedProp(reactive, (oldLength - 1).toString())
        if (prop) trigger(prop);
        const op = asTrackedOp(reactive, 'at', - 1)
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