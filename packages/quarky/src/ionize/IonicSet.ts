import { AnyObject } from "@rue/types";
import { emitSignal } from "../debug";
import { getActiveTracker } from "../derivations/DependencyTracker";
import { META } from "../ReactiveEntity";
import { trigger, triggerIonicAtom } from "../trigger";
import { isNonTrackable, toRawIfNeeded, IonicModel, storeSnapshot, ionize, registerIonicModel, reactiveSetter } from "./IonicModel";
import { triggerReactiveWithMutationOp, useGetOp } from "./IonicCapsule";
import { getTrackedOp } from "./TrackedOp";
import { Collection, MetaIonicCollection, MetaIonicModel } from "./MetaIonicModel";
import { isAnyIon } from "../ion/AnyIon";
import { accessMethod, maybeIonize } from "./IonicObject";
import { getProtectedModelMeta } from "./ProtectedIonicModel";
import { mutatingSetOps } from "@rue/utils";
import { asTrackedProp, getObservedProp } from "./PropIon";


export function createIonicSet(
    target: Set<any>,
    methods: AnyObject | undefined
) {
    const metaIonicModel = new MetaIonicCollection(target, methods)

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

            if (key in mutatingSetOps) {
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

            if (typeof key === 'symbol' && key.description === 'Symbol.iterator') {
                return value;
            }

            if (isNonTrackable(key, Set))
                return value;

            if (isAnyIon(value))
                return value();

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
            const tracker = getActiveTracker()
            if (!tracker)
                return _value;
            tracker.track(asTrackedProp(ionicModel, key))
            return _value;
        },
        set(target, key, value, receiver) {
            return reactiveSetter(
                Set,
                ionicModel,
                metaIonicModel,
                target,
                key,
                value,
                receiver
            )
        }
    }) as IonicModel<Set<any>>

    const boundMethodMap: Map<string | symbol, Function> = new Map([
        ['has', useGetOp(
            ionicModel,
            target,
            'has',
            target.has
        )],
        ['add', addOp],
        ['clear', useClearOp(
            ionicModel,
            metaIonicModel,
            target
        )],
        ['delete', useDeleteOp(
            ionicModel,
            metaIonicModel,
            target
        )]
    ])

    function addOp(newValue: any) {
        const oldSize = target.size
        const _newValue = toRawIfNeeded(newValue)
        const output = target.add(_newValue); //perform op
        const newSize = target.size


        if (oldSize === newSize) return;
        storeSnapshot(metaIonicModel)

        const sizeProp = getObservedProp(ionicModel, 'size')
        if (sizeProp)
            trigger(sizeProp, newSize, oldSize);

        const hasOp = getTrackedOp(ionicModel, 'has', _newValue)
        if (hasOp) triggerIonicAtom(hasOp);

        triggerReactiveWithMutationOp(
            ionicModel,
            'add',
            [_newValue],
            output
        )

        return output;
    }

    metaIonicModel.initIonicModel(ionicModel)
    registerIonicModel(ionicModel, target)
    return ionicModel
}




export function useDeleteOp(
    ionicModel: IonicModel<Collection>,
    metaIonicModel: MetaIonicModel<Collection>,
    target: AnyObject
) {
    return function deleteOp(key: any) {
        const oldSize = target.size
        const output = target.delete(key); //perform op
        const newSize = target.size

        if (oldSize === newSize) return;

        storeSnapshot(metaIonicModel)

        const sizeProp = getObservedProp(ionicModel, 'size')
        if (sizeProp)
            trigger(sizeProp, newSize, oldSize);

        const hasOp = getTrackedOp(ionicModel, 'has', key)
        if (hasOp) triggerIonicAtom(hasOp);

        if (target instanceof Map) {
            const getOp = getTrackedOp(ionicModel, 'get', key)
            if (getOp) triggerIonicAtom(getOp);
        }

        triggerReactiveWithMutationOp(
            ionicModel,
            'delete',
            [key],
            output
        )

        return output;
    }
}



export function useClearOp(
    ionicModel: IonicModel<Collection>,
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
                const hasOp = getTrackedOp(ionicModel, 'has', entryKey)
                if (hasOp) triggerIonicAtom(hasOp);

                if (target instanceof Map) {
                    const getOp = getTrackedOp(ionicModel, 'get', entryKey)
                    if (getOp) triggerIonicAtom(getOp);
                }
            }
        }

        const sizeProp = getObservedProp(ionicModel, 'size')
        if (sizeProp)
            trigger(sizeProp, newSize, oldSize);


        triggerReactiveWithMutationOp(
            ionicModel,
            'clear',
            [],
            output
        )

        return output;
    }
}


