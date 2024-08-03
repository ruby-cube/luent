import { AnyObject } from "@rue/types";
import { track, trigger } from "./watch";
import { emitSignal } from "./useReactivity";
import { isObjectLiteral, KeyPath, Ref } from "@rue/utils";

export type ReactiveModel<T extends AnyObject = AnyObject> = T

const reactiveMap: WeakMap<ReactiveModel, AnyObject> = new WeakMap();
const deepReactives: WeakSet<ReactiveModel> = new WeakSet();
const DEEP = true;
const O$DEPTH = 1;
const O$$$DEPTH = 3;

export function isDeepReactive(value: any): value is ReactiveModel {
    return deepReactives.has(value);
}

export function useReactiveModels(config?: { snapshots: boolean }) {
    const localReactives: WeakSet<ReactiveModel> = new WeakSet();
    function registerReactive(reactive: ReactiveModel, target: AnyObject) {
        localReactives.add(reactive);
        reactiveMap.set(reactive, target);
    }

    let mutationPermitted = new Ref(false);

    return {
        o$$$<T extends AnyObject>(target: T): ReactiveModel<T> {
            if (reactiveMap.has(target)) return target; // prevents double wrapped reactive

            const reactive = createReactive(target, registerReactive, mutationPermitted, DEEP)
            if (reactive === null) {
                if (__DEV__) console.warn(`INVALID INPUT: o$ must receive an reference-type primitive (object)`)
                return target;
            }
            registerReactive(reactive, target);
            deepReactives.add(reactive);
            return reactive as ReactiveModel<T>
        },

        o$<T extends AnyObject>(target: T): ReactiveModel<T> {
            if (reactiveMap.has(target)) return target; // prevents double wrapped reactive

            const reactive = createReactive(target, registerReactive, mutationPermitted)
            if (reactive === null) {
                if (__DEV__) console.warn(`INVALID INPUT: o$ must receive an reference-type primitive (object)`)
                return target;
            }
            registerReactive(reactive, target)
            return reactive as ReactiveModel<T>
        },

        mu<T extends ReactiveModel>(target: T, mutation: (o: T) => void) {
            if (!localReactives.has(target)) throw "`mu` can only mutate local reactives created with corresponding `o$` function";
            mutationPermitted.o = true;
            mutation(target);
            mutationPermitted.o = false;
        }
    }
}

export function isReactiveModel(obj: AnyObject): obj is ReactiveModel {
    return reactiveMap.has(obj);
}

export function isReactiveObject(obj: AnyObject): obj is ReactiveModel {
    const original = toRaw(obj);
    if (original instanceof Array) return false;
    if (original instanceof Map) return false;
    if (original instanceof Set) return false;
    return reactiveMap.has(obj);
}

export function toRaw<T extends AnyObject>(reactive: ReactiveModel<T>): T {
    const raw = reactiveMap.get(reactive);
    if (!raw) return reactive;
    return raw as T;
}

function createReactiveObject(
    target: AnyObject,
    registerReactive: (reactive: ReactiveModel, target: AnyObject) => void,
    mutationPermitted: Ref<boolean>,
    deep?: boolean
) {
    const reactive = new Proxy(target, {
        get(target, key, receiver) {
            const value = Reflect.get(target, key, receiver);
            if (isNonTrackable(key, Object)) return value;
            const descriptor = Reflect.getOwnPropertyDescriptor(target, key);
            if (descriptor?.writable === false) return value;
            emitSignal();
            track(reactive, key)
            return value;
        },
        set(target, key, newValue, receiver) {
            if (!mutationPermitted.o) throw new Error("Object is readonly. It can only be mutated through corresponding `mu` function")
            const oldValue = Reflect.get(target, key, receiver);
            if (oldValue === newValue) {
                Reflect.set(target, key, newValue, receiver);
                return true;
            }
            const _newValue = maybeReactivize(newValue, reactive, oldValue, registerReactive, mutationPermitted)
            trigger(reactive, _newValue, oldValue, key)
            Reflect.set(target, key, _newValue, receiver);
            return true;
        }
    })

    if (deep) {
        for (const key in target) {
            const value = target[key];
            if (!(value instanceof Object)) continue;
            if (reactiveMap.has(value)) continue; // prevents double wrapped reactive
            const value$ = createReactive(value, registerReactive, mutationPermitted, DEEP)
            if (value$ === null) continue;
            target[key] = value$;
            registerReactive(value$, value)
            deepReactives.add(value$)
        }
    }
    return reactive;
}

function maybeReactivize(
    newValue: any,
    reactive: ReactiveModel,
    oldValue: any,
    registerReactive: (reactive: ReactiveModel, target: AnyObject) => void,
    mutationPermitted: Ref<boolean>,
) {
    const reactiveDepth = shouldReactivize(reactive, oldValue, newValue);
    return reactiveDepth === O$$$DEPTH ? createReactive(newValue, registerReactive, mutationPermitted, DEEP)
        : reactiveDepth === O$DEPTH ? createReactive(newValue, registerReactive, mutationPermitted)
            : newValue;
}

function createReactive(
    value: any,
    registerReactive: (reactive: ReactiveModel, target: AnyObject) => void,
    mutationPermitted: Ref<boolean>,
    deep?: boolean
) {
    return isObjectLiteral(value) ? createReactiveObject(value, registerReactive, mutationPermitted, deep)
        : value instanceof Array ? createReactiveArray(value, registerReactive, mutationPermitted, deep)
            : null; //TODO: Maps and sets
}


function shouldReactivize(
    target: ReactiveModel,
    prevValue: any,
    newValue: any,
): 1 | 3 | false {
    if (!(newValue instanceof Object)) return false;
    if (deepReactives.has(target)) return O$$$DEPTH;
    if (reactiveMap.has(prevValue)) return O$DEPTH;
    return false;
}


function createReactiveArray(
    target: any[],
    registerReactive: (reactive: ReactiveModel, target: AnyObject) => void,
    mutationPermitted: Ref<boolean>, deep?: boolean
) {
    const reactive = new Proxy(target, {
        get(target, key, receiver) {
            const value = Reflect.get(target, key, receiver);
            if (isMutatingArrayMethod(key)) {
                if (!mutationPermitted.o) throw new Error("Object is readonly. It can only be mutated through corresponding `mu` function")
                return (...args: any[]) => {
                    trigger(reactive, target, target, key, args);
                    // TODO: intercept new items based on type of method and maybeReactivize
                    return (<Function>value).apply(reactive, args);
                };
            }
            if (isNonTrackable(key, Array)) return value;
            emitSignal();
            track(reactive, key)
            return value;
        },
        set(target, key, newValue, receiver) {
            if (!mutationPermitted.o) throw new Error("Object is readonly. It can only be mutated through corresponding `mu` function")
            const oldValue = Reflect.get(target, key, receiver);
            if (oldValue === newValue || isNonTrackable(key, Array)) {
                Reflect.set(target, key, newValue, receiver);
                return true;
            }
            const _newValue = maybeReactivize(newValue, reactive, oldValue, registerReactive, mutationPermitted)
            trigger(reactive, _newValue, oldValue, key)
            Reflect.set(target, key, _newValue, receiver);
            return true;
        }
    })
    if (deep) {
        for (let i = 0; i < target.length; i++) {
            const item = target[i]
            if (reactiveMap.has(item)) continue;
            if (!(item instanceof Object)) continue;
            const item$ = createReactive(item, registerReactive, mutationPermitted, DEEP)
            if (item$ === null) continue;
            target[i] = item$;
            registerReactive(item$, item)
            deepReactives.add(item$)
        }
    }
    return reactive;
}

function isNonTrackable(key: PropertyKey, type: typeof Array | typeof Object | typeof Map | typeof Set) {
    if (typeof key !== "string") return false;
    if (type === Object) {
        return nonTrackableObjectKeys.has(key)
    }
    else if (type === Array) {
        return nonTrackableArrayKeys.has(key)

    }
    else if (type === Map) {
        return nonTrackableMapKeys.has(key)
    }
    else if (type === Set) {
        return nonTrackableSetKeys.has(key)
    }
}

const nonTrackableObjectKeys = getNonTrackableKeys({})
const nonTrackableArrayKeys = getNonTrackableKeys([])
nonTrackableArrayKeys.delete('length')
const nonTrackableMapKeys = getNonTrackableKeys(new Map())
nonTrackableMapKeys.delete('size')
const nonTrackableSetKeys = getNonTrackableKeys(new Set())
nonTrackableSetKeys.delete('size')

function getNonTrackableKeys(target: AnyObject) {
    return new Set(Object.getOwnPropertyNames(Object.getPrototypeOf(target)))
}

const mutatingArrayMethods = new Set([
    "push",
    "pop",
    "shift",
    "unshift",
    "splice",
    "sort",
    "reverse",
    "copyWithin",
    "fill"
]);

function isMutatingArrayMethod(key: PropertyKey) {
    if (typeof key !== "string") return false;
    return mutatingArrayMethods.has(key);
}


// function isIntegerKey(key: unknown) {
//     const keyAsNumber = Number(key);
//     if (isNaN(keyAsNumber)) return false;
//     if (Number.isInteger(keyAsNumber)) return true
// }

