import { AnyObject } from "@rue/types";
import { isIonicAtom } from "../derivations/IonicAtom";
import { META } from "../ReactiveEntity";
import { trigger, triggerIonicAtom } from "../trigger";
import { asObservedProp, getObservedProp } from "./ObservedProp";
import { createReactiveModel, createReactiveTraps, isNonTrackable, isIonicModel, toRawIfNeeded, IonicModel, storeSnapshot, toRaw, triggerIonicModelWithSetOp, ionize, registerIonicModel, setAbsorbedIon } from "./IonicModel";
import { asTrackedOp, getTrackedOp } from "./TrackedOp";
import { maybeUnreactivizeArgs, triggerReactiveWithMutationOp, useGetOp } from "./IonicCapsule";
import { emitSignal } from "../debug";
import { isMutatingArrayMethod } from "@rue/utils";
import { getActiveTracker } from "../derivations/DependencyTracker";
import { Collection, MetaIonicCollection, MetaIonicModel } from "./MetaIonicModel";
import { isAnyIon } from "../ion/AnyIon";
import { accessMethod, maybeIonize } from "./IonicObject";
import { getProtectedModelMeta, isReadonlyProxy } from "./ProtectedIonicModel";

export function createIonicArray(
    target: any[],
    methods: AnyObject | undefined
) {
    const boundMethodMap: Map<string | symbol, Function> = new Map()
    const metaIonicModel = new MetaIonicCollection(target, methods)
    const ionicModel = new Proxy(target, {
        get(target, key, receiver) {
            return reactiveArrayGetter(
                ionicModel,
                methods,
                metaIonicModel,
                function handleMutatingMethod(key: string, fn) {
                    return (...args: any[]) => {
                        return mutatingArrayOp(
                            args,
                            ionicModel,
                            metaIonicModel,
                            target,
                            key,
                            fn
                        )
                    }
                },
                <any[]>target,
                key,
                receiver,
                boundMethodMap
            )
        },
        set(target, key, value, receiver) {
            return reactiveArraySetter(
                ionicModel,
                metaIonicModel,
                target,
                key,
                value,
                receiver
            )
        }
    }) as IonicModel<any[]>
    metaIonicModel.initIonicModel(ionicModel)
    registerIonicModel(ionicModel, target)
    return ionicModel
}


export function createIonicTuple<T extends any[]>(
    target: T,
    methods: AnyObject | undefined
) {

    const boundMethodMap: Map<string | symbol, Function> = new Map()
    const metaIonicModel = new MetaIonicCollection(target, methods)
    const ionicModel = new Proxy(target, {
        get(target, key, receiver) {
            return reactiveArrayGetter(
                ionicModel,
                methods,
                metaIonicModel,
                function handleMutatingMethod() {
                    throw new Error("Tuples can only be mutated by index")
                },
                <any[]>target,
                key,
                receiver,
                boundMethodMap
            )
        },
        set(target, key, value, receiver) {
            return reactiveArraySetter(
                ionicModel,
                metaIonicModel,
                target,
                key,
                value,
                receiver
            )
        }
    }) as IonicModel<any[]>
    metaIonicModel.initIonicModel(ionicModel)
    registerIonicModel(ionicModel, target)
    return ionicModel
}

// export function createReactiveArrayItems(
//     target: any[],
// ) {
//     for (let i = 0; i < target.length; i++) {
//         const item = target[i]
//         if (isIonicModel(item)) continue;
//         if (!(item instanceof Object)) continue;
//         const item$ = createReactiveModel(item, DEEP)
//         if (item$ === null) continue;
//         target[i] = item$;
//     }
// }


function reactiveArrayGetter(
    ionicModel: IonicModel<Collection>,
    methods: AnyObject | undefined,
    metaIonicModel: MetaIonicCollection,
    handleMutatingMethod: (key: string, fn: Function) => (...args: any[]) => any,
    target: any[],
    key: string | symbol,
    receiver: AnyObject,
    boundMethodMap: Map<string | symbol, Function>
) {
    if (__DEV__) emitSignal();
    if (key === META) return metaIonicModel;
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
    // if (key === '_$' && deep) return asShallowReactive(target);
    const value = Reflect.get(target, key, receiver);
    if (typeof key === 'symbol' && key.description === 'Symbol.iterator') {
        return value;
    }
    if (isNonTrackable(key, Array)) return value;
    if (isAnyIon(value) && !isIntegerKey(key)) return value();
    if (isMutatingArrayMethod(key)) {
        if (isReadonlyProxy(target, ionicModel, receiver)) {
            if (__DEV__) console.warn('Object is readonly. Cannot access methods')
            return undefined;
        }
        if (protectedMeta) {
            const keys = protectedMeta.propertyKeys
            if (keys && key in keys) {
                return handleMutatingMethod(<string>key, value);
            }
            return undefined;
        }
        return handleMutatingMethod(<string>key, value);
    }
    if (value instanceof Function)
        return accessMethod(
            target,
            ionicModel,
            receiver,
            key,
            boundMethodMap,
            value
        )
    if (key === 'at') {
        return useGetOp(
            ionicModel,
            target,
            key,
            value
        )
    }
    const _value = maybeIonize(value, target, ionicModel, receiver)
    const tracker = getActiveTracker()
    if (!tracker) return _value;

    tracker.track(asObservedProp(ionicModel, key))
    return _value;
}



function reactiveArraySetter(
    ionicModel: IonicModel,
    metaIonicModel: MetaIonicCollection,
    target: AnyObject,
    key: string | symbol,
    newValue: any,
    receiver: AnyObject
) {
    if (metaIonicModel.isNewProperty(key)) metaIonicModel.registerNewProperty(key)
    const _newValue = toRawIfNeeded(newValue)
    const op = target instanceof Array && isIntegerKey(key) ? getTrackedOp(ionicModel, 'at', key) : null;
    const prop = getObservedProp(ionicModel, key);
    if (!prop && !op) {
        // Reflect.set(target, key, newValue, receiver);
        target[key] = _newValue
        return true;
    }
    const oldValue = Reflect.get(target, key, receiver);
    if (isAnyIon(oldValue) && !isIntegerKey(key)) //TODO: replaceAbsorbedIon. //QUESTION: Should Indices absorb ions? Vue doesn't
        return setAbsorbedIon(oldValue, _newValue)
    if (oldValue === _newValue || isNonTrackable(key, Array)) {
        // Reflect.set(target, key, newValue, receiver);
        target[key] = _newValue
        return true;
    }


    // Reflect.set(target, key, _newValue, receiver);
    target[key] = _newValue // cannot use Reflect.set because it does not set the property synchronously

    storeSnapshot(metaIonicModel)

    if (prop) {
        trigger(prop, _newValue, oldValue)
    }

    if (op) {
        triggerIonicAtom(op)
    }

    const trackedIndices = metaIonicModel.observedEntryKeys
    if (trackedIndices && key === 'length') {
        for (const indexKey of trackedIndices) {
            if (typeof indexKey !== 'string') {
                console.warn(`index key is not string. May need to refactor code`)
                continue;
            }
            const index = parseInt(indexKey)
            if (index > _newValue || index > oldValue) {
                const prop = getObservedProp(ionicModel, indexKey)
                if (prop) {
                    trigger(prop, _newValue, oldValue)
                }
                const op = getTrackedOp(ionicModel, 'at', index)
                if (op) {
                    if (isIonicAtom(op)) {
                        triggerIonicAtom(op)
                    }
                }
            }
        }
    }

    triggerIonicModelWithSetOp(
        ionicModel,
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
    ionicModel: IonicModel<any[]>,
    metaIonicModel: MetaIonicCollection<any[]>,
    target: AnyObject,
    key: string,
    fn: Function
) {
    const _args = maybeUnreactivizeArgs(key, args);
    const oldLength = target.length;
    const output = fn.apply(ionicModel, _args); // perform mutation
    const newLength = target.length;
    if (oldLength === newLength) return output; //FIX: Some methods will mutate but not change the length, like fill
    storeSnapshot(metaIonicModel)

    const lengthProp = getObservedProp(ionicModel, 'length')
    if (lengthProp) {
        trigger(lengthProp, newLength, oldLength); // trigger for length change
    }

    if (key === 'pop') {
        const prop = getObservedProp(ionicModel, (oldLength - 1).toString())
        if (prop) trigger(prop);
        const op = getTrackedOp(ionicModel, 'at', - 1)
        if (op) triggerIonicAtom(op);
    }

    const trackedIndices = metaIonicModel.observedEntryKeys
    if (trackedIndices && oldLength < newLength) {
        for (const indexKey of trackedIndices) {
            if (typeof indexKey !== 'string') {
                console.warn(`index key is not string. May need to refactor code`)
                continue;
            }
            const index = parseInt(indexKey)
            if (index >= newLength) {
                const prop = getObservedProp(ionicModel, indexKey)
                if (prop) {
                    trigger(prop)
                }
                const op = getTrackedOp(ionicModel, 'at', index)
                if (op) {
                    if (isIonicAtom(op)) {
                        triggerIonicAtom(op)
                    }
                }
            }
        }
    }

    triggerReactiveWithMutationOp(
        ionicModel,
        key,
        _args,
        output
    )

    return output;
}



export function isReactiveArray(target: any): target is IonicModel<any[]> {
    if (!isIonicModel(target)) return false;
    if (toRaw(target) instanceof Array) return true;
    return false;
}