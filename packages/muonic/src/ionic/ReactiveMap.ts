import { emitSignal } from "../debug";
import { getActiveTracker } from "../derivations/DependencyTracker";
import { META } from "../ReactiveEntity";
import { trigger, triggerReactiveAtom } from "../trigger";
import { asObservedProp, getObservedProp } from "./ObservedProp";
import { asDeepReactive, asShallowReactive, createReactiveTraps, isNonTrackable, maybeAsDeepReactive, maybeUnreactivize, ReactiveModel, reactiveSetter, ReactiveTraps, registerReactive, storeSnapshot } from "./ReactiveModel";
import { triggerReactiveWithMutationOp, useGetOp } from "./ReactiveCapsule";
import { useClearOp, useDeleteOp } from "./ReactiveSet";
import { asTrackedOp, getTrackedOp } from "./TrackedOp";
import { MetaReactiveCollection, MetaReactiveModel } from "./MetaReactiveModel";



export function createReactiveMap(
    target: Map<any, any>,
    deep: boolean = false,
    existingMeta?: MetaReactiveCollection
) {
    const traps = createReactiveTraps(target,
        function get(target, key) {
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
                        metaReactive,
                        target
                    )

                case 'delete':
                    return useDeleteOp(
                        reactive,
                        metaReactive,
                        target
                    )

                case '_$':
                    if (deep) return asShallowReactive(target);
                    return maybeAsDeepReactive(value, deep)

                case META:
                    return metaReactive

                default:
                    const _value = maybeAsDeepReactive(value, deep)
                    const tracker = getActiveTracker()
                    if (!tracker)
                        return _value;
                    tracker.track(asObservedProp(reactive, key))
                    return _value;
            }
        },
        function set(target, key, value, receiver) {
            return reactiveSetter(
                Map,
                reactive,
                metaReactive,
                target,
                key,
                value,
                receiver
            )
        }
    )

    function setOp(key: any, newValue: any) {
        const oldSize = target.size
        const oldValue = target.get(key);
        const _newValue = maybeUnreactivize(newValue)
        const output = target.set(key, _newValue); //perform op
        const newSize = target.size

        if (oldValue === _newValue) return;

        storeSnapshot(metaReactive)

        const reactive = deep ? metaReactive.deepReactive! : metaReactive.shallowReactive!
        if (oldSize !== newSize) {
            const sizeProp = getObservedProp(reactive, 'size')
            if (sizeProp)
                trigger(sizeProp);
        }

        const hasOp = getTrackedOp(reactive, 'has', key)
        if (hasOp) triggerReactiveAtom(hasOp);
        const getOp = getTrackedOp(reactive, 'get', key)
        if (getOp) triggerReactiveAtom(getOp);

        triggerReactiveWithMutationOp(
            reactive,
            'set',
            [key, _newValue],
            output
        )

        return output;
    }

    const metaReactive = existingMeta || new MetaReactiveCollection(target, traps)
    const reactive = new Proxy(target, traps) as ReactiveModel<Map<any, any>>

    return registerReactive(
        target,
        reactive,
        metaReactive,
        deep
    )
}


