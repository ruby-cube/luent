import { AnyObject } from "@rue/types";
import { emitSignal } from "../debug";
import { getActiveTracker } from "../derivations/DependencyTracker";
import { META } from "../ReactiveEntity";
import { trigger, triggerReactiveAtom } from "../trigger";
import { asObservedProp, getObservedProp } from "./ObservedProp";
import { asDeepReactive, asShallowReactive, createReactiveTraps, isNonTrackable, maybeAsDeepReactive, maybeUnreactivize, ReactiveModel, ReactiveTraps, registerReactive, storeSnapshot } from "./ReactiveModel";
import { triggerReactiveWithMutationOp, useGetOp } from "./ReactiveCapsule";
import { asTrackedOp, getTrackedOp } from "./TrackedOp";
import { Collection, MetaReactiveCollection, MetaReactiveModel } from "./MetaReactiveModel";


export function createReactiveSet(
    target: Set<any>,
    deep: boolean = false,
    existingMeta?: MetaReactiveCollection
) {
    const traps = createReactiveTraps(target,
        function get(target, key, receiver) {
            if (__DEV__) emitSignal()
            const value = Reflect.get(target, key, receiver)
            if (typeof key === 'symbol' && key.description === 'Symbol.iterator') {
                return value;
            }
            if (isNonTrackable(key, Set)) return value;

            switch (key) {
                case 'has':
                    return useGetOp(
                        reactive,
                        target,
                        key,
                        value
                    );

                case 'add':
                    return addOp

                case 'clear':
                    return useClearOp(
                        reactive,
                        metaReactive,
                        target
                    )

                case 'delete':
                    return useDeleteOp(
                        reactive,
                        metaReactive,
                        target
                    )

                case META:
                    return metaReactive

                case '_$':
                    if (deep) return asShallowReactive(target);
                    return maybeAsDeepReactive(value, deep)

                default:
                    const _value = maybeAsDeepReactive(value, deep)
                    const tracker = getActiveTracker()
                    if (!tracker)
                        return _value;
                    tracker.track(asObservedProp(reactive, key))
                    return _value;
            }
        })

    function addOp(newValue: any) {
        const oldSize = target.size
        const _newValue = maybeUnreactivize(newValue)
        const output = target.add(_newValue); //perform op
        const newSize = target.size


        if (oldSize === newSize) return;
        storeSnapshot(metaReactive)

        const sizeProp = getObservedProp(reactive, 'size')
        if (sizeProp)
            trigger(sizeProp);

        const hasOp = getTrackedOp(reactive, 'has', _newValue)
        if (hasOp) triggerReactiveAtom(hasOp);

        triggerReactiveWithMutationOp(
            reactive,
            'add',
            [_newValue],
            output
        )

        return output;
    }


    const metaReactive = existingMeta || new MetaReactiveCollection(target, traps)
    const reactive = new Proxy(target, traps) as ReactiveModel<Set<any>>

    return registerReactive(
        target,
        reactive,
        metaReactive,
        deep
    )
}


export function useDeleteOp(
    reactive: ReactiveModel<Collection>,
    metaReactive: MetaReactiveModel<Collection>,
    target: AnyObject
) {
    return function deleteOp(key: any) {
        const oldSize = target.size
        const output = target.delete(key); //perform op
        const newSize = target.size

        if (oldSize === newSize) return;

        storeSnapshot(metaReactive)

        const sizeProp = getObservedProp(reactive, 'size')
        if (sizeProp)
            trigger(sizeProp);

        const hasOp = getTrackedOp(reactive, 'has', key)
        if (hasOp) triggerReactiveAtom(hasOp);

        if (target instanceof Map) {
            const getOp = getTrackedOp(reactive, 'get', key)
            if (getOp) triggerReactiveAtom(getOp);
        }

        triggerReactiveWithMutationOp(
            reactive,
            'delete',
            [key],
            output
        )

        return output;
    }
}



export function useClearOp(
    reactive: ReactiveModel<Collection>,
    metaReactive: MetaReactiveCollection,
    target: AnyObject,
) {
    return function clearOp() {
        const oldSize = target.size
        const output = target.clear(); //perform op
        const newSize = target.size

        if (oldSize === newSize) return;

        storeSnapshot(metaReactive)

        const trackedEntries = metaReactive.observedEntryKeys
        if (trackedEntries) {
            for (const entryKey of trackedEntries) {
                const hasOp = getTrackedOp(reactive, 'has', entryKey)
                if (hasOp) triggerReactiveAtom(hasOp);

                if (target instanceof Map) {
                    const getOp = getTrackedOp(reactive, 'get', entryKey)
                    if (getOp) triggerReactiveAtom(getOp);
                }
            }
        }

        const sizeProp = getObservedProp(reactive, 'size')
        if (sizeProp)
            trigger(sizeProp);


        triggerReactiveWithMutationOp(
            reactive,
            'clear',
            [],
            output
        )

        return output;
    }
}


