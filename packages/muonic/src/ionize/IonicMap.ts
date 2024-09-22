import { emitSignal } from "../debug";
import { getActiveTracker } from "../derivations/DependencyTracker";
import { META } from "../ReactiveEntity";
import { trigger, triggerIonicAtom } from "../trigger";
import { asObservedProp, getObservedProp } from "./ObservedProp";
import { createReactiveTraps, isNonTrackable, toRawIfNeeded, IonicModel, reactiveSetter, storeSnapshot, ionize, registerIonicModel } from "./IonicModel";
import { triggerReactiveWithMutationOp, useGetOp } from "./IonicCapsule";
import { useClearOp, useDeleteOp } from "./IonicSet";
import { asTrackedOp, getTrackedOp } from "./TrackedOp";
import { MetaIonicCollection, MetaIonicModel } from "./MetaIonicModel";



export function createIonicMap(
    target: Map<any, any>,
) {
    const metaIonicModel = new MetaIonicCollection(target)
    const reactive = new Proxy(target, {
        get(target, key) {
            if (__DEV__) emitSignal()
            const value = target[<keyof Map<any, any>>key] as any
            if (typeof key === 'symbol' && key.description === 'Symbol.iterator') {
                return value;
            }
            if (isNonTrackable(key, Map))
                return value;

            switch (key) {
                case 'get':
                case 'has':
                    return useGetOp(
                        reactive,
                        target,
                        key,
                        value
                    );

                case 'set':
                    return setOp

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

                // case '_$':
                //     if (deep) return asShallowReactive(target);
                //     return maybeAsDeepReactive(value, deep)

                case META:
                    return metaIonicModel

                default:
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
                Map,
                reactive,
                metaIonicModel,
                target,
                key,
                value,
                receiver
            )
        }
    }) as IonicModel<Map<any, any>>


    function setOp(key: any, newValue: any) {
        const oldSize = target.size
        const oldValue = target.get(key);
        const _newValue = toRawIfNeeded(newValue)
        const output = target.set(key, _newValue); //perform op
        const newSize = target.size

        if (oldValue === _newValue) return;

        storeSnapshot(metaIonicModel)

        const reactive = metaIonicModel.ionicModel!
        if (oldSize !== newSize) {
            const sizeProp = getObservedProp(reactive, 'size')
            if (sizeProp)
                trigger(sizeProp);
        }

        const hasOp = getTrackedOp(reactive, 'has', key)
        if (hasOp) triggerIonicAtom(hasOp);
        const getOp = getTrackedOp(reactive, 'get', key)
        if (getOp) triggerIonicAtom(getOp);

        triggerReactiveWithMutationOp(
            reactive,
            'set',
            [key, _newValue],
            output
        )

        return output;
    }
    metaIonicModel.initIonicModel(reactive)
    registerIonicModel(reactive, target)
    return reactive
}


