import { AnyObject } from "@rue/types";
import { track, trigger } from "./watch";
import { emitSignal } from "./useReactivity";
import { KeyPath } from "@rue/utils";
import { getCurrentUpdateCycle } from "./UpdateCycle";

export type ReactiveModel<T extends AnyObject = AnyObject> = T

const reactiveMap: WeakMap<ReactiveModel, AnyObject> = new WeakMap();

export function useReactiveModel(config?: { snapshots: boolean }) {
    const localReactives: WeakSet<ReactiveModel> = new WeakSet();

    let mutationPermitted = false;

    return {
        o$<T extends AnyObject>(target: T): ReactiveModel<T> {

            const reactive = target instanceof Array ?
                createReactiveArray(target, mutationPermitted)
                : createReactiveObject(target, mutationPermitted)
            localReactives.add(reactive)
            reactiveMap.set(reactive, target)
            return reactive as ReactiveModel<T>
        },

        mu<T extends ReactiveModel>(target: T, mutation: (o: T) => void) {
            if (!localReactives.has(target)) throw "`mu` can only mutate local reactives created with corresponding `o$` function";
            mutationPermitted = true;
            mutation(target);
            mutationPermitted = false;
        }
    }
}

export function isReactiveModel(obj: AnyObject): obj is ReactiveModel {
    return reactiveMap.has(obj);
}

export function isReactiveObject(obj: AnyObject): obj is ReactiveModel {
    if (obj instanceof Array) return false;
    if (obj instanceof Map) return false;
    if (obj instanceof Set) return false;
    return reactiveMap.has(obj);
}

export function toRaw<T extends AnyObject>(reactive: ReactiveModel<T>): T {
    const raw = reactiveMap.get(reactive);
    if (!raw) return reactive;
    return raw as T;
}

function createReactiveObject(target: AnyObject, mutationPermitted: boolean) {
    const reactive = new Proxy(target, {
        get(target, key, receiver) {
            const value = Reflect.get(target, key, receiver);
            if (isNonTrackable(key, Object)) return value;
            const descriptor = Reflect.getOwnPropertyDescriptor(target, key);
            if (descriptor?.writable === false) return value;
            emitSignal();
            track(value, target, key)
            return value;
        },
        set(target, key, newValue, receiver) {
            if (!mutationPermitted) throw new Error("Object is readonly. It can only be mutated through corresponding `mu` function")
            const oldValue = Reflect.get(target, key, receiver);
            if (oldValue !== newValue) {
                trigger(reactive, newValue, oldValue, key)
            }
            Reflect.set(target, key, receiver);
            return true;
        }
    })
    return reactive;
}



function createReactiveArray(target: any[], mutationPermitted: boolean) {
    const reactive = new Proxy(target, {
        get(target, key, receiver) {
            const value = Reflect.get(target, key, receiver);
            if (isMutatingArrayMethod(key)) {
                if (!mutationPermitted) throw new Error("Object is readonly. It can only be mutated through corresponding `mu` function")
                return (...args: any[]) => {
                    trigger(reactive, target, target, key, args)
                    return (<Function>value).apply(target, args);
                };
            }
            if (isNonTrackable(key, Array)) return value;
            emitSignal();
            track(value, target, key)
            return value;
        },
        set(target, key, newValue, receiver) {
            if (!mutationPermitted) throw new Error("Object is readonly. It can only be mutated through corresponding `mu` function")
            const oldValue = Reflect.get(target, key, receiver);
            if (oldValue !== newValue || !isNonTrackable(key, Array)) {
                trigger(reactive, newValue, oldValue, key)
            }
            Reflect.set(target, key, receiver);
            return true;
        }
    })
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
const nonTrackableMapKeys = getNonTrackableKeys(new Map())
const nonTrackableSetKeys = getNonTrackableKeys(new Set())

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

