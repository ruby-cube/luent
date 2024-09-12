import { emitSignal } from "../debug";
import { getActiveTracker } from "../derivations/DependencyTracker";
import { META } from "../ReactiveEntity";
import { trigger, triggerReactiveAtom } from "../trigger";
import { asObservedProp } from "./ObservedProp";
import { isNonTrackable, maybeReactivize, ReactiveModelContainer, reactiveSetter, storeSnapshot } from "./Reactive$";
import { triggerReactiveWithMutationOp, useGetOp } from "./ReactiveCapsule";
import { MetaReactiveCollection } from "./ReactiveCollection";
import { useClearOp, useDeleteOp } from "./ReactiveSet";
import { asTrackedOp } from "./TrackedOp";


export function createReactiveMap(
    target: Map<any, any>,
    deep: boolean = false
) {
    let sampleValue: any; //TODO:

    const container = new ReactiveModelContainer(target, deep)
    const metaReactive = container[META];

    const reactive = new Proxy(container, {
        get(_, key) {
            if (__DEV__) emitSignal()
            const value = target[<keyof Map<any, any>>key] as any
            if (typeof key === 'symbol' && key.description === 'Symbol.iterator') {
                return value;
            }

            switch (key) {
                case 'get':
                case 'has':
                    return useGetOp(
                        metaReactive,
                        target,
                        key,
                        value
                    );

                case 'set':
                    return setOp

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
                    if (!tracker || isNonTrackable(key, Map))
                        return value;
                    tracker.track(asObservedProp(metaReactive.o, key))
                    return value;
            }
        },
        set: (_, key, value, receiver) =>
            reactiveSetter(
                Map,
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
    metaReactive.initReactiveModel(reactive)

    function setOp(key: any, newValue: any) {
        const oldSize = target.size
        const oldValue = target.get(key);
        const _newValue = maybeReactivize(newValue, metaReactive, oldValue) //FIX: I don't know if relying on oldValue to determine reactivize is reliable. What if user sets value to undefined?
        const output = target.set(key, _newValue); //perform op
        const newSize = target.size

        if (oldValue === _newValue) return;

        storeSnapshot(metaReactive)

        const reactive = metaReactive.o
        if (oldSize !== newSize) {
            const sizeProp = asObservedProp(reactive, 'size')
            if (sizeProp)
                trigger(sizeProp);
        }

        const hasOp = asTrackedOp(reactive, 'has', key)
        if (hasOp) triggerReactiveAtom(hasOp);
        const getOp = asTrackedOp(reactive, 'get', key)
        if (getOp) triggerReactiveAtom(getOp);

        triggerReactiveWithMutationOp(
            reactive,
            'set',
            [key, _newValue],
            output
        )

        return output;
    }


    const entries = Array.from(target)
    sampleValue = entries[0]

    if (deep) {
        throw new Error("Deep has not been implemented for reactive maps!") //TODO: implement if needed
        // for (let i = 0; i < entries.length; i++) {
        //     const [key, value] = entries[i];
        //     if (reactiveMap.has(item)) continue;
        //     if (!(item instanceof Object)) continue;
        //     const item$ = createReactive(item, register, DEEP)
        //     if (item$ === null) continue;
        //     target[i] = item$;
        // }
        // target.clear()
        // loop through entries and target.set(key, value)
    }
    return reactive;
}


