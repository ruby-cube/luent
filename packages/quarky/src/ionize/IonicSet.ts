import { AnyObject } from "@rue/types";
import { emitSignal } from "../debug";
import { getActiveTracker } from "../derivations/DependencyTracker";
import { META } from "../ReactiveEntity";
import { trigger, triggerIonicAtom } from "../trigger";
import { asObservedProp, getObservedProp } from "./ObservedProp";
import { isNonTrackable, toRawIfNeeded, IonicModel, storeSnapshot, ionize, registerIonicModel, reactiveSetter } from "./IonicModel";
import { triggerReactiveWithMutationOp, useGetOp } from "./IonicCapsule";
import { getTrackedOp } from "./TrackedOp";
import { Collection, MetaIonicCollection, MetaIonicModel } from "./MetaIonicModel";
import { isAnyIon } from "../ion/AnyIon";
import { accessMethod } from "./IonicObject";


export function createIonicSet(
    target: Set<any>,
    methods: AnyObject | undefined
) {


    function addOp(newValue: any) {
        const oldSize = target.size
        const _newValue = toRawIfNeeded(newValue)
        const output = target.add(_newValue); //perform op
        const newSize = target.size


        if (oldSize === newSize) return;
        storeSnapshot(metaIonicModel)

        const sizeProp = getObservedProp(reactive, 'size')
        if (sizeProp)
            trigger(sizeProp, newSize, oldSize);

        const hasOp = getTrackedOp(reactive, 'has', _newValue)
        if (hasOp) triggerIonicAtom(hasOp);

        triggerReactiveWithMutationOp(
            reactive,
            'add',
            [_newValue],
            output
        )

        return output;
    }


    const metaIonicModel = new MetaIonicCollection(target, methods)
    const reactive = new Proxy(target, {
        get(target, key, receiver) {
            if (__DEV__) emitSignal()
            if (methods && key in methods) {
                return accessMethod(
                    methods[key],
                    target,
                    reactive,
                    receiver,
                    key
                )
            }
            const value = Reflect.get(target, key, receiver)
            if (typeof key === 'symbol' && key.description === 'Symbol.iterator') {
                return value;
            }
            if (isNonTrackable(key, Set)) return value;
            if (isAnyIon(value)) return value();
            //TODO: readonly and protected method access
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
                        metaIonicModel,
                        target
                    )

                case 'delete':
                    return useDeleteOp(
                        reactive,
                        metaIonicModel,
                        target
                    )

                case META:
                    return metaIonicModel

                default:
                    if (value instanceof Function) return value.bind(reactive)
                    const _value = value instanceof Object ? ionize(value) : value
                    const tracker = getActiveTracker()
                    if (!tracker)
                        return _value;
                    tracker.track(asObservedProp(reactive, key))
                    return _value;
            }
        },
        set(target, key, value, receiver) {
            return reactiveSetter(
                Set,
                reactive,
                metaIonicModel,
                target,
                key,
                value,
                receiver
            )
        }
    }) as IonicModel<Set<any>>

    metaIonicModel.initIonicModel(reactive)
    registerIonicModel(reactive, target)
    return reactive
}


export function useDeleteOp(
    reactive: IonicModel<Collection>,
    metaIonicModel: MetaIonicModel<Collection>,
    target: AnyObject
) {
    return function deleteOp(key: any) {
        const oldSize = target.size
        const output = target.delete(key); //perform op
        const newSize = target.size

        if (oldSize === newSize) return;

        storeSnapshot(metaIonicModel)

        const sizeProp = getObservedProp(reactive, 'size')
        if (sizeProp)
            trigger(sizeProp, newSize, oldSize);

        const hasOp = getTrackedOp(reactive, 'has', key)
        if (hasOp) triggerIonicAtom(hasOp);

        if (target instanceof Map) {
            const getOp = getTrackedOp(reactive, 'get', key)
            if (getOp) triggerIonicAtom(getOp);
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
    reactive: IonicModel<Collection>,
    metaIonicModel: MetaIonicCollection,
    target: AnyObject,
) {
    return function clearOp() {
        const oldSize = target.size
        const output = target.clear(); //perform op
        const newSize = target.size

        if (oldSize === newSize) return;

        storeSnapshot(metaIonicModel)

        const trackedEntries = metaIonicModel.observedEntryKeys
        if (trackedEntries) {
            for (const entryKey of trackedEntries) {
                const hasOp = getTrackedOp(reactive, 'has', entryKey)
                if (hasOp) triggerIonicAtom(hasOp);

                if (target instanceof Map) {
                    const getOp = getTrackedOp(reactive, 'get', entryKey)
                    if (getOp) triggerIonicAtom(getOp);
                }
            }
        }

        const sizeProp = getObservedProp(reactive, 'size')
        if (sizeProp)
            trigger(sizeProp, newSize, oldSize);


        triggerReactiveWithMutationOp(
            reactive,
            'clear',
            [],
            output
        )

        return output;
    }
}


