import { AnyObject } from "@rue/types";
import { track, trigger } from "./watch";
import { emitSignal } from "./useReactivity";
import { isObjectLiteral, KeyPath, Ref } from "@rue/utils";
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

            const reactive = target instanceof Array ? //TODO: Sets and maps
                createReactiveArray(<any[]><unknown>target, addLocalReactive, mutationPermitted)
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
            track(value, reactive, key)
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
        if (!(value instanceof Object)) continue;
        if (reactiveMap.has(value)) continue; // prevents double wrapped reactive
        const value$ = isObjectLiteral(value) ?
            createReactiveObject(value, addLocalReactive, mutationPermitted) :
            value instanceof Array ? createReactiveArray(value, addLocalReactive, mutationPermitted) : null; //TODO: Maps and sets
        if (value$ === null) continue;
        target[key] = value$;
        reactiveMap.set(value$, value);
        addLocalReactive(value$);
    }
    return reactive;
}





function createReactiveArray(target: any[], addLocalReactive: (target: ReactiveModel) => void, mutationPermitted: Ref<boolean>) {
    const reactive = new Proxy(target, {
        get(target, key, receiver) {
            const value = Reflect.get(target, key, receiver);
            if (isMutatingArrayMethod(key)) {
                if (!mutationPermitted.o) throw new Error("Object is readonly. It can only be mutated through corresponding `mu` function")
                return (...args: any[]) => {
                    trigger(reactive, target, target, key, args);
                    // return (<Function>value).apply(target, args);
                    return (<Function>value).apply(reactive, args);
                };
            }
            if (isNonTrackable(key, Array)) return value;
            emitSignal();
            track(value, reactive, key)
            return value;
        },
        set(target, key, newValue, receiver) {
            if (!mutationPermitted.o) throw new Error("Object is readonly. It can only be mutated through corresponding `mu` function")
            const oldValue = Reflect.get(target, key, receiver);
            if (oldValue !== newValue || !isNonTrackable(key, Array)) {
                trigger(reactive, newValue, oldValue, key)
            }
            Reflect.set(target, key, newValue, receiver);
            return true;
        }
    })
    for (let i = 0; i < target.length; i++) {
        const item = target[i]
        if (reactiveMap.has(item)) continue;
        if (!(item instanceof Object)) continue;
        const item$ = isObjectLiteral(item) ?
        createReactiveObject(item, addLocalReactive, mutationPermitted) :
        item instanceof Array ? createReactiveArray(item, addLocalReactive, mutationPermitted) : null;
        if (item$ === null) continue;  //TODO: Maps and sets
        target[i] = item$;
        reactiveMap.set(item$, item);
        addLocalReactive(item$);
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

