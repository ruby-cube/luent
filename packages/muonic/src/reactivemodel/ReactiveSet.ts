import { AnyObject } from "@rue/types";
import { emitSignal } from "../debug";
import { getActiveTracker } from "../derivations/DependencyTracker";
import { META } from "../ReactiveEntity";
import { trigger, triggerReactiveAtom } from "../trigger";
import { asObservedProp } from "./ObservedProp";
import { isNonTrackable, maybeReactivize, ReactiveModelContainer, storeSnapshot } from "./Reactive$";
import { triggerReactiveWithMutationOp, useGetOp } from "./ReactiveCapsule";
import { Collection, MetaReactiveCollection } from "./ReactiveCollection";
import { MetaReactiveModel } from "./ReactiveModel";
import { asTrackedOp } from "./TrackedOp";
import { createReactiveArrayItems } from "./ReactiveArray";


export function createReactiveSet(
    target: Set<any>,
    deep: boolean = false
) {
    let sampleValue: any;

    const container = new ReactiveModelContainer(target, deep);
    const metaReactive = container[META]

    const reactive = new Proxy(container, {
        get: (_, key) => {
            if (__DEV__) emitSignal()
            const value = target[<keyof Set<any>>key] as any
            if (typeof key === 'symbol' && key.description === 'Symbol.iterator') {
                return value;
            }

            switch (key) {
                case 'has':
                    return useGetOp(
                        metaReactive,
                        target,
                        key,
                        value
                    );

                case 'add':
                    return addOp

                case 'clear':
                    return useClearOp(
                        metaReactive,
                        target
                    )

                case 'delete':
                    return useDeleteOp(
                        metaReactive,
                        target
                    )

                case META:
                    return metaReactive

                default:
                    const tracker = getActiveTracker()
                    if (!tracker || isNonTrackable(key, Set))
                        return value;
                    tracker.track(asObservedProp(metaReactive.o, key))
                    return value;
            }
        },
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
    metaReactive.initReactiveModel(reactive)
    const values = Array.from(target);
    sampleValue = values[0];

    function addOp(newValue: any) {

        const oldSize = target.size
        const _newValue = maybeReactivize(newValue, metaReactive, sampleValue)
        const output = target.add(_newValue); //perform op
        const newSize = target.size
        const reactive = metaReactive.o

        if (oldSize === newSize) return;

        storeSnapshot(metaReactive)

        const sizeProp = asObservedProp(reactive, 'size')
        if (sizeProp)
            trigger(sizeProp);

        const hasOp = asTrackedOp(reactive, 'has', _newValue)
        if (hasOp) triggerReactiveAtom(hasOp);

        triggerReactiveWithMutationOp(
            metaReactive.o,
            'add',
            [_newValue],
            output
        )

        return output;
    }


    if (deep) {
        createReactiveArrayItems(values)
        target.clear();
        for (const value of values) {
            target.add(value);
        }
    }
    return reactive;
}


export function useDeleteOp(
    metaReactive: MetaReactiveModel<Collection>,
    target: AnyObject
) {
    return function deleteOp(key: any) {
        const reactive = metaReactive.o
        const oldSize = target.size
        const output = target.delete(key); //perform op
        const newSize = target.size

        if (oldSize === newSize) return;

        storeSnapshot(metaReactive)

        const sizeProp = asObservedProp(reactive, 'size')
        if (sizeProp)
            trigger(sizeProp);

        const hasOp = asTrackedOp(reactive, 'has', key)
        if (hasOp) triggerReactiveAtom(hasOp);

        if (target instanceof Map) {
            const getOp = asTrackedOp(reactive, 'get', key)
            if (getOp) triggerReactiveAtom(getOp);
        }

        triggerReactiveWithMutationOp(
            metaReactive.o,
            'delete',
            [key],
            output
        )

        return output;
    }
}



export function useClearOp(
    metaReactive: MetaReactiveCollection,
    target: AnyObject,
) {
    return function clearOp(key: any) {
        const reactive = metaReactive.o

        const oldSize = target.size
        const output = target.delete(key); //perform op
        const newSize = target.size

        if (oldSize === newSize) return;

        storeSnapshot(metaReactive)

        const trackedEntries = metaReactive.observedEntryKeys
        if (trackedEntries) {
            for (const entryKey of trackedEntries) {
                const hasOp = asTrackedOp(reactive, 'has', entryKey)
                if (hasOp) triggerReactiveAtom(hasOp);

                if (target instanceof Map) {
                    const getOp = asTrackedOp(reactive, 'get', entryKey)
                    if (getOp) triggerReactiveAtom(getOp);
                }
            }
        }

        const sizeProp = asObservedProp(reactive, 'size')
        if (sizeProp)
            trigger(sizeProp);

        const hasOp = asTrackedOp(reactive, 'has', key)
        if (hasOp) triggerReactiveAtom(hasOp);

        if (target instanceof Map) {
            const getOp = asTrackedOp(reactive, 'get', key)
            if (getOp) triggerReactiveAtom(getOp);
        }

        triggerReactiveWithMutationOp(
            metaReactive.o,
            'delete',
            [key],
            output
        )

        return output;
    }
}


