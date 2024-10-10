import { emitSignal } from "../debug";
import { getActiveTracker } from "../derivations/DependencyTracker";
import { META } from "../ReactiveEntity";
import { trigger, triggerIonicAtom } from "../trigger";
import { createReactiveTraps, isNonTrackable, toRawIfNeeded, IonicModel, reactiveSetter, storeSnapshot, ionize, registerIonicModel } from "./IonicModel";
import { triggerReactiveWithMutationOp, UNDEFINED_OP, useGetOp } from "./IonicCapsule";
import { useClearOp, useDeleteOp } from "./IonicSet";
import { asTrackedOp, getTrackedOp } from "./TrackedOp";
import { MetaIonicCollection, MetaIonicModel } from "./MetaIonicModel";
import { isAnyIon } from "../ion/AnyIon";
import { AnyObject } from "@rue/types";
import { accessMethod, maybeIonize } from "./IonicObject";
import { mutatingMapOps, noop } from "@rue/utils";
import { getProtectedModelMeta } from "./ProtectedIonicModel";
import { asTrackedProp, getObservedProp } from "./PropIon";



export function createIonicMap(
    target: Map<any, any>,
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
            if (key in mutatingMapOps) {
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
            if (isNonTrackable(key, Map))
                return value;
            if (isAnyIon(value)) return value();

            if (value instanceof Function)
                return accessMethod(
                    target,
                    ionicModel,
                    receiver,
                    key,
                    boundMethodMap,
                    value
                )
            const _value = maybeIonize(value, target, ionicModel, receiver)
            const tracker = getActiveTracker()
            if (!tracker)
                return _value;
            tracker.track(asTrackedProp(ionicModel, key))
            return _value;
        },
        set(target, key, value, receiver) {
            return reactiveSetter(
                Map,
                ionicModel,
                metaIonicModel,
                target,
                key,
                value,
                receiver
            )
        }
    }) as IonicModel<Map<any, any>>


    const boundMethodMap: Map<string | symbol, (...arg: any[]) => any> = new Map([
        ['set', setOp],
        ['has', useGetOp(
            ionicModel,
            target,
            'has',
            target.has
        )],
        ['get', useGetOp(
            ionicModel,
            target,
            'get',
            target.get
        )],
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

    function setOp(key: any, newValue: any) {
        const oldSize = target.size
        const oldValue = target.get(key);
        const _newValue = toRawIfNeeded(newValue)
        const output = target.set(key, _newValue); //perform op
        const newSize = target.size

        if (oldValue === _newValue) return;

        storeSnapshot(metaIonicModel)

        const ionicModel = metaIonicModel.ionicModel!
        if (oldSize !== newSize) {
            const sizeProp = getObservedProp(ionicModel, 'size')
            if (sizeProp)
                trigger(sizeProp, newSize, oldSize);
        }

        const hasOp = getTrackedOp(ionicModel, 'has', key)
        if (hasOp) triggerIonicAtom(hasOp);
        const getOp = getTrackedOp(ionicModel, 'get', key)
        if (getOp) triggerIonicAtom(getOp);

        triggerReactiveWithMutationOp(
            ionicModel,
            'set',
            [key, _newValue],
            output
        )

        return output;
    }

    metaIonicModel.initIonicModel(ionicModel)
    registerIonicModel(ionicModel, target)
    return ionicModel
}


