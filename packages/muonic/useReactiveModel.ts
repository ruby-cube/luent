import { AnyObject } from "@rue/types";
import { track, trigger } from "./watch";
import { emitSignal } from "./useReactivity";
import { KeyPath, Ref } from "@rue/utils";
import { getCurrentUpdateCycle } from "./UpdateCycle";

export type ReactiveModel<T extends AnyObject = AnyObject> = T

const reactiveMap: WeakMap<ReactiveModel, AnyObject> = new WeakMap();

export function useReactiveModel(config?: { snapshots: boolean }) {
    const localReactives: WeakSet<ReactiveModel> = new WeakSet();
    function addLocalReactive(reactive: ReactiveModel) {
        localReactives.add(reactive);
    }

    let mutationPermitted = new Ref(false);

    return {
        o$<T extends AnyObject>(target: T): ReactiveModel<T> {
            if (reactiveMap.has(target)) return target; // prevents double wrapped reactive

            const reactive = toRaw(target) instanceof Array ? //TODO: Sets and maps
                createReactiveArray(<any[]><unknown>target, mutationPermitted)
                : createReactiveObject(target, addLocalReactive, mutationPermitted)
            localReactives.add(reactive)
            reactiveMap.set(reactive, target)
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

function createReactiveObject(target: AnyObject, addLocalReactive: (reactive: ReactiveModel) => void, mutationPermitted: Ref<boolean>) {
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
            if (!mutationPermitted.o) throw new Error("Object is readonly. It can only be mutated through corresponding `mu` function")
            const oldValue = Reflect.get(target, key, receiver);
            if (oldValue !== newValue) {
                trigger(reactive, newValue, oldValue, key)
            }
            Reflect.set(target, key, newValue, receiver);
            return true;
        }
    })
    for (const key in target) {
        const value = target[key];
        if (reactiveMap.has(value)) continue; // prevents double wrapped reactive
        if (Object.getPrototypeOf(value) === Object) {
            const reactive = createReactiveObject(value, addLocalReactive, mutationPermitted)
            target[key] = reactive;
            reactiveMap.set(reactive, value);
            addLocalReactive(reactive);
        }
    }
    return reactive;
}





function createReactiveArray(target: any[], mutationPermitted: Ref<boolean>) {
    const reactive = new Proxy(target, {
        get(target, key, receiver) {
            const value = Reflect.get(target, key, receiver);
            if (isMutatingArrayMethod(key)) {
                if (!mutationPermitted.o) throw new Error("Object is readonly. It can only be mutated through corresponding `mu` function")
                return (...args: any[]) => {
            console.log("trigger via", key)
                    trigger(reactive, target, target, key, args);
                    // return (<Function>value).apply(target, args);
                    return (<Function>value).apply(reactive, args);
                };
            }
            if (isNonTrackable(key, Array)) return value;
            emitSignal();
            track(value, target, key)
            console.log("track length", key === 'length')
            return value;
        },
        set(target, key, newValue, receiver) {
            console.log("trigger length", key === 'length', newValue)
            if (!mutationPermitted.o) throw new Error("Object is readonly. It can only be mutated through corresponding `mu` function")
            const oldValue = Reflect.get(target, key, receiver);
            if (oldValue !== newValue || !isNonTrackable(key, Array)) {
                console.log("triggered", key, newValue)
                trigger(reactive, newValue, oldValue, key)
            }
            Reflect.set(target, key, newValue, receiver);
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

