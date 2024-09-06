import { AnyObject } from "@rue/types";
import { emitSignal } from "./hasReactivity_DEV";
import { isPlainObject, KeyPath, Ref, isMutatingMapMethod, isMutatingSetMethod, isMutatingArrayMethod, inheritsFrom } from "@rue/utils";
import { isTuple, tuple } from "./tuple";
import { asReactiveProp, getReactiveProp } from "./ReactiveProp";
import { shallowClone } from "./SnapshotManager";
import { asTrackableOp, getTrackableOp } from "./TrackableOp";
import { getRootWatchedModelAndKeyPath, isNestedWatched } from "./deepWatch";
import { triggerReactiveModel, triggerReactivePrimitive } from "../src_v2/trigger";
import { isWatched } from "../src_v2/watch";
import { asReactiveAtom, isReactiveAtom } from "../src_v2/ReactiveAtom";
import { isDerivedSignal } from "./DerivedSignal";
import { getWithoutTracking, track } from "./DependencyTracker";
import { useUpdateCycle } from "../src_v2/UpdateCycle";

export type ReactiveModel<T extends AnyObject = AnyObject> = T
type RegisterReactive = (reactive: ReactiveModel, target: AnyObject, deep: boolean | undefined) => void
// type RegisterReactive = {
//     register: RegisterReactive,
//     mutationPermitted: boolean
// }

export type Readonly<T extends AnyObject = AnyObject> = {
    readonly [K in keyof T]: T[K]
}

const reactiveMap: WeakMap<ReactiveModel, AnyObject> = new WeakMap();
const deepReactives: WeakSet<ReactiveModel> = new WeakSet();
const DEEP = true;
const O$DEPTH = 1;
const O$$$DEPTH = 3;

function register(reactive: ReactiveModel, target: AnyObject, deep: boolean | undefined) {
    // localReactives.add(reactive);
    reactiveMap.set(reactive, target);
    if (deep) deepReactives.add(reactive)
}


export function isDeepReactive(value: any): value is ReactiveModel {
    return deepReactives.has(value);
}

// export function useReactiveModels(config?: { snapshots: boolean }) {
// const localReactives: WeakSet<ReactiveModel> = new WeakSet();
// const register = {
//     ,
//     mutationPermitted: false,
// }

function _o$<T extends AnyObject>(target: T, deep?: boolean): T {
    if (reactiveMap.has(target)) return target; // prevents double wrapped reactive

    const reactive = createReactive(target, register, deep)
    if (reactive === null) {
        if (__DEV__) console.warn(`INVALID INPUT: Reactive$ must receive a reference-type primitive (object)`)
        return target;
    }
    return reactive as T;
}

// return {
export function DeepReactive$<T extends AnyObject>(target: T): ReactiveModel<T> {
    return _o$(target, DEEP);
}

export function Reactive$<T extends AnyObject>(target: T): ReactiveModel<T> {
    return _o$(target);
}

// mu<T extends ReactiveModel, R>(mutation: () => R): R {
//     // if (!localReactives.has(target)) throw "`mu` can only mutate local reactives created with corresponding `o$` function";
//     register.mutationPermitted = true;
//     const output = mutation();
//     register.mutationPermitted = false;
//     return output;
// }
// }
// }

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
    register: RegisterReactive,
    deep?: boolean
) {
    const reactiveRef = new Ref<ReactiveModel>()

    const reactive = new Proxy(target, {
        get(target, key, receiver) {
            const value = Reflect.get(target, key, receiver);
            if (isNonTrackable(key, Object)) {
                return value;
            }
            const descriptor = Reflect.getOwnPropertyDescriptor(target, key);
            if (descriptor?.writable === false) return value;
            if (__DEV__) emitSignal();
            track(asReactiveProp(reactive, key));
            return value;
        },
        set: (target, key, value, receiver) =>
            reactiveSetter(
                Object,
                reactiveRef,
                register,
                target,
                key,
                value,
                receiver
            )
    })
    reactiveRef.o = reactive;

    if (deep) {
        for (const key in target) {
            const value = target[key];
            if (!(value instanceof Object)) continue;
            if (reactiveMap.has(value)) continue; // prevents double wrapped reactive
            const value$ = createReactive(value, register, DEEP)
            if (value$ === null) continue;
            target[key] = value$;
        }
    }
    return reactive;
}

function maybeReactivize(
    newValue: any,
    reactive: ReactiveModel,
    oldValue: any,
    register: RegisterReactive
) {
    if (reactiveMap.has(newValue)) return newValue;
    const reactiveDepth = shouldReactivize(reactive, oldValue, newValue);
    return reactiveDepth === O$$$DEPTH ? createReactive(newValue, register, DEEP)
        : reactiveDepth === O$DEPTH ? createReactive(newValue, register)
            : newValue;
}

function createReactive(
    value: any,
    register: RegisterReactive,
    deep?: boolean
): ReactiveModel | null {
    if (reactiveMap.has(value)) return value;
    const reactive = isPlainObject(value) ? createReactiveObject(value, register, deep)
        // : isReactiveCapsule(value) ? createReactive(value.$, register, deep)
        : isTuple(value) ? createReactiveTuple(value, register, deep)
            : value instanceof Array ? createReactiveArray(value, register, deep)
                : value instanceof Set ? createReactiveSet(value, register, deep)
                    : value instanceof Map ? createReactiveMap(value, register, deep)
                        : null;
    if (reactive) {
        register(reactive, value, deep);
    }
    return reactive;
}

// function isReactiveCapsule(value: any): value is { $: AnyObject } {
//     if (!(value instanceof Object) || isPlainObject(value)) return false;
//     if (!('$' in value)) return false;
//     if (!(value.$ instanceof Object)) return false;
//     return true;
// }


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
    register: RegisterReactive,
    deep?: boolean
) {
    const reactiveRef = new Ref<ReactiveModel>();
    let sampleValue: any;

    const reactive = new Proxy(target, {
        get: (target, key, receiver) => reactiveArrayGetter(
            reactive,
            (key, fn) => (...args: any[]) => {
                // if (!register.mutationPermitted) throw new Error("Object is readonly. It can only be mutated through corresponding `mu` function")
                return mutatingOp(
                    args,
                    reactive,
                    target,
                    sampleValue,
                    register,
                    key,
                    fn
                )
            },
            target,
            key,
            receiver
        ),
        set: (target, key, value, receiver) =>
            reactiveSetter(
                Array,
                reactiveRef,
                register,
                target,
                key,
                value,
                receiver
            )

    })
    reactiveRef.o = reactive;
    sampleValue = reactive[0];

    if (deep) {
        createReactiveArrayItems(target, register)
    }
    return reactive;
}

function isNonTrackable(key: PropertyKey, DataStructure: typeof Array | typeof Object | typeof Set | typeof Map) {
    if (typeof key !== "string") return false;
    if (DataStructure instanceof Array || DataStructure instanceof Set || DataStructure instanceof Map)
        return key in nonTrackableCollectionKeys || key in nonTrackableObjectKeys;
    return key in nonTrackableObjectKeys
}

//TODO: actually, there are many methods that should be trackable! like array.find ... etc
const nonTrackableObjectKeys = {
    constructor: true,
    __defineGetter__: true,
    __defineSetter__: true,
    hasOwnProperty: true,
    __lookupGetter__: true,
    __lookupSetter__: true,
    isPrototypeOf: true,
    propertyIsEnumerable: true,
    toString: true,
    valueOf: true,
    __proto__: true,
    toLocaleString: true
}

const nonTrackableCollectionKeys = {
    forEach: true
}

const trackableCollectionOps = {
    keys: true,  // newIterable = keys()
    entries: true, // newEntriesIterator = entries()
    values: true, // newIterable = values()
}

const trackableArrayOps = {
    // same as accessor
    at: true, // item = at(index) //NOTE: trackable ops

    // whole array, triggered by any change to array

    toReversed: true, // newArray = toReversed()
    flat: true, // newArray = flat(depth?)
    toSorted: true, // newArray = toSorted(compareFn?)
    flatMap: true, // newArray = flatMap(callbackFn, thisArg?)
    map: true, // newArray = map(callbackFn, thisArg?)
    reduce: true, // result = reduce(callbackFn, initialValue?)
    reduceRight: true, // result = reduceRight(callbackFn, initialValue?)

    join: true, // string = join(separator?)
    toLocaleString: true, // string = toLocaleString() 
    toString: true, // string = toString()


    // check if result changed
    lastIndexOf: true, // index = lastIndexOf(item, fromIndex)
    indexOf: true, // index = indexOf(item, fromIndex)
    includes: true, // boolean = includes(item, fromIndex?)

    // args
    find: true, // item = find(callbackFn, thisArg?)
    findLast: true, // item = findLast(callbackFn, thisArg?)

    findIndex: true, // index = findIndex(callbackFn, thisArg?)
    findLastIndex: true, // index = findLastIndex(callbackFn, thisArg?)

    filter: true, // newArray = filter(callbackFn, thisArg?)

    every: true, // boolean = every(callbackFn, thisArg?)
    some: true, // boolean = some(callbackFn, thisArg?)


    // copyWithin: true,
    // fill: true,
    // pop: true,
    // push: true,
    // reverse: true,
    // shift: true,
    // unshift: true,
    // sort: true,
    // splice: true,

    // keys: true,  // newIterable = keys()
    // entries: true, // newEntriesIterator = entries()
    // values: true, // newIterable = values()
    // forEach: true,


    slice: true, // newArray = slice(start?, end?)

    concat: true, // newArray = concat(arrayB, arrayC, ...)
    toSpliced: true, // newArray = toSpliced(start?, deleteCount?, item1, item2, /* …, */ itemN)

    with: true, // newArray = arrayInstance.with(index, value)
}

const trackableMapOps = {
    get: true, // value = get(key)  //NOTE: trackable ops
    has: true, // boolean = has(key) //NOTE: trackable ops
    // set: true,
    // delete: true,
    // clear: true,
    // forEach: true,
    // entries: true, // newEntriesIterator = entries()
    // keys: true, // newIterable = keys()
    // values: true, // newIterable = values()
    // size: true,
}

const trackableSetOps = {
    has: true, // boolean = has(item) //NOTE: trackable ops

    // add: true,
    // delete: true,
    // clear: true,
    // forEach: true,
    // size: true,
    // entries: true, // newEntriesIterator = entries()
    // keys: true, // newIterable = keys()
    // values: true, // newIterable = values()

    difference: true, // newSet = difference(otherSet) 
    union: true,
    intersection: true,
    symmetricDifference: true,

    isSubsetOf: true, // boolean = isSubsetOf(otherSet)
    isSupersetOf: true, // boolean = isSupersetOf(otherSet)
    isDisjointFrom: true, // boolean = isDisjointFrom(otherSet)
}

// function getNonTrackableKeys(target: AnyObject) {
//     return new Set(Object.getOwnPropertyNames(Object.getPrototypeOf(target)))
// }


const insertOps = {
    push: { from: 0 },
    unshift: { from: 0 },
    splice: { from: 2 },
    fill: { at: 0 },
    add: { at: 0 },
    set: { from: 0 }
}






function maybeReactivizeArgs(
    op: string,
    args: any[],
    reactive: ReactiveModel,
    sampleValue: any,
    register: RegisterReactive
) {
    if (!(op in insertOps)) return args;

    const itemPosition = insertOps[<keyof typeof insertOps>op]
    const hasSingleItem = 'at' in itemPosition
    const newItems = hasSingleItem ? [args[itemPosition.at]] : args.slice(itemPosition.from);
    const _newItems: any[] = [];
    for (const newItem of newItems) {
        _newItems.push(maybeReactivize(newItem, reactive, sampleValue, register))
    }
    if (hasSingleItem) {
        args[itemPosition.at] = _newItems[0];
    }
    else {
        args.splice(itemPosition.from, _newItems.length, ..._newItems)
    }
    return args;
}


function createReactiveTuple(
    target: any[],
    register: RegisterReactive,
    deep?: boolean
) {

    const reactiveRef = new Ref<ReactiveModel>()
    const reactive = new Proxy(target, {
        get: (target, key, receiver) => reactiveArrayGetter(
            reactive,
            () => {
                throw new Error("Tuples can only be mutated by index")
            },
            target,
            key,
            receiver
        ),
        set: (target, key, value, receiver) =>
            reactiveSetter(
                Array,
                reactiveRef,
                register,
                target,
                key,
                value,
                receiver
            )
    })
    reactiveRef.o = reactive;

    if (deep) {
        createReactiveArrayItems(target, register)
    }
    return reactive;
}


function reactiveArrayGetter(
    reactive: ReactiveModel,
    handleMutatingMethod: (key: string | symbol, fn: Function) => (...args: any[]) => any,
    target: any[],
    key: string | symbol,
    receiver: any[]
) {
    const value = Reflect.get(target, key, receiver);
    if (isMutatingArrayMethod(key)) {
        return handleMutatingMethod(key, value);
    }
    if (isNonTrackable(key, Array)) return value;
    if (key === 'at') {
        return (index: number) =>
            trackedGetOp(
                index,
                reactive,
                target,
                key,
                value
            )
    }
    if (__DEV__) emitSignal();
    track(asReactiveProp(reactive, key))
    return value;
}


function reactiveSetter(
    DataStructure: typeof Array | typeof Object | typeof Set | typeof Map,
    reactiveRef: Ref<ReactiveModel>,
    register: RegisterReactive,
    target: AnyObject,
    key: string | symbol,
    newValue: any,
    receiver: AnyObject
) {
    // if (!register.mutationPermitted) throw new Error("Object is readonly. It can only be mutated through corresponding `mu` function")
    const reactive = reactiveRef.o!
    const op = target instanceof Array && isIntegerKey(key) ? getTrackableOp(reactive, 'at', key) : null;
    const prop = getReactiveProp(reactive, key);
    if (!prop && !op) {
        Reflect.set(target, key, newValue, receiver);
        return true;
    }
    const oldValue = Reflect.get(target, key, receiver);
    if (oldValue === newValue || isNonTrackable(key, DataStructure) || isNonSettable(<string>key, DataStructure)) {
        Reflect.set(target, key, newValue, receiver);
        return true;
    }
    const _newValue = maybeReactivize(newValue, reactive, oldValue, register)



    if (prop) {
        triggerReactivePrimitive(prop, _newValue, oldValue)
    }

    if (op) {
        triggerReactivePrimitive(op, _newValue, oldValue)
    }

    if (target instanceof Array) {
        if (key === 'length') {
            const newLength = _newValue > -1 ? _newValue < target.length ? _newValue : target.length : 0;
            let i = target.length;
            while (i > newLength) {
                i--;
                const prop = getReactiveProp(reactive, i.toString())
                if (prop) {
                    const item = target[i];
                    triggerReactivePrimitive(prop, undefined, item)
                }
                const op = getTrackableOp(reactive, 'at', i.toString())
                if (op) {
                    const item = target[i];
                    triggerReactivePrimitive(op, undefined, item);
                }
            }
        }
        else if (isIntegerKey(key)) {
            const op = getTrackableOp(reactive, 'at', key)
            if (op) {
                const oldValue = target[parseInt(<string>key)]
                triggerReactivePrimitive(op, _newValue, oldValue);
            }
        }
    }

    if (isWatched(reactive)) {
        const updateCycle = useUpdateCycle();
        triggerReactiveModel(reactive, {
            target: reactive,
            op: {
                type: '[[set]]',
                key,
                newValue: _newValue,
                oldValue
            }
        },
            updateCycle.getSnapshot(reactive) ?
                undefined : shallowClone(target)
        ) // only create clone if snapshot does not already exist
    }
    if (isNestedWatched(reactive)) {
        const updateCycle = useUpdateCycle();
        const [rootWatchedModel, keyPath] = getRootWatchedModelAndKeyPath(reactive)
        triggerReactiveModel(rootWatchedModel, {
            target: reactive,
            targetPath: keyPath,
            op: {
                type: '[[set]]',
                key,
                newValue: _newValue,
                oldValue
            }
        },
            updateCycle.getSnapshot(rootWatchedModel) ?
                undefined : shallowClone(toRaw(rootWatchedModel))
        )
    }

    Reflect.set(target, key, _newValue, receiver);
    return true;
}

export function isIntegerKey(key: unknown) {
    const keyAsNumber = Number(key);
    if (isNaN(keyAsNumber)) return false;
    if (Number.isInteger(keyAsNumber)) return true
}

// Because insertion of values don't yield differing new and old values for size and length in the setter,
// we need to manually check old and new values at time of mutation
function isNonSettable(key: string, DataStructure: typeof Array | typeof Object | typeof Set | typeof Map) {
    if (DataStructure === Object) return false;
    if (DataStructure === Array && key === 'length') return true;
    if (key === 'size') return true;
    return false;
}

function createReactiveArrayItems(
    target: any[],
    register: RegisterReactive
) {
    for (let i = 0; i < target.length; i++) {
        const item = target[i]
        if (reactiveMap.has(item)) continue;
        if (!(item instanceof Object)) continue;
        const item$ = createReactive(item, register, DEEP)
        if (item$ === null) continue;
        target[i] = item$;
    }
}



function createReactiveSet(
    target: Set<any>,
    register: RegisterReactive,
    deep?: boolean
) {
    // const reactiveRef = new Ref<ReactiveModel>();
    let sampleValue: any;

    const reactive = new Proxy(target, {
        get: (target: Set<any>, key: string, receiver: Set<any>) => {
            const value = Reflect.get(target, key, receiver);

            if (isMutatingSetMethod(key)) {
                return (...args: any[]) => {
                    // if (!register.mutationPermitted) throw new Error("Object is readonly. It can only be mutated through corresponding `mu` function")
                    return mutatingOp(
                        args,
                        reactive,
                        target,
                        sampleValue,
                        register,
                        key,
                        value
                    )
                }
            }

            if (key === 'has') {
                return (item: any) =>
                    trackedGetOp(
                        item,
                        reactive,
                        target,
                        key,
                        value
                    )
            }

            if (isNonTrackable(key, Set)) return value;
            if (__DEV__) emitSignal();
            track(asReactiveProp(reactive, key))
            return value;
        }
    })

    // reactiveRef.o = reactive;

    const values = Array.from(target);
    sampleValue = values[0];

    if (deep) {
        createReactiveArrayItems(values, register)
        target.clear();
        for (const value of values) {
            target.add(value);
        }
    }
    return reactive;
}





function mutatingOp(
    args: any[],
    reactive: ReactiveModel,
    target: AnyObject,
    sampleValue: any,
    register: RegisterReactive,
    key: string | symbol,
    fn: Function
) {
    const _args = maybeReactivizeArgs(<string>key, args, reactive, sampleValue, register);
    const updateCycle = useUpdateCycle();
    const clone = updateCycle.getSnapshot(reactive) ? undefined : shallowClone(target) // cloning before mutation if snapshot does not already exist
    let hasMutated = false;

    const oldMapValue = target instanceof Map && (key === 'set' || key === 'clear' || key === 'delete') ? target.get(_args[0]) : null;
    const lastItem = target instanceof Array && key === 'pop' ? target.at(-1) : null

    if (target instanceof Map && key === 'set') {
        const mapKey = _args[0]
        const newValue = _args[1];
        if (oldMapValue !== newValue) {
            if (isWatched(reactive)) {
                triggerReactiveModel(reactive, {
                    target: reactive,
                    op: {
                        type: 'set',
                        key,
                        newValue,
                        oldValue: oldMapValue
                    }
                }, clone)
            }
            if (isNestedWatched(reactive)) {
                const [rootWatchedModel, keyPath] = getRootWatchedModelAndKeyPath(reactive)
                triggerReactiveModel(rootWatchedModel, {
                    target: reactive,
                    targetPath: keyPath,
                    op: {
                        type: 'set',
                        key,
                        newValue,
                        oldValue: oldMapValue
                    }
                }, clone)
            }

            const hasOp = getTrackableOp(reactive, 'has', mapKey)
            if (hasOp) triggerReactivePrimitive(hasOp, newValue, oldMapValue);
            const getOp = getTrackableOp(reactive, 'get', mapKey)
            if (getOp) triggerReactivePrimitive(getOp, newValue, oldMapValue);
        }
    }

    const sizeKey = target instanceof Array ? 'length' : 'size';
    const sizeProp = getReactiveProp(reactive, sizeKey)
    if (sizeProp && isReactiveAtom(sizeProp)) {
        const atom = asReactiveAtom(sizeProp);
        for (const derivation of atom.derivations) {
            const derivedSignal = derivation.o;
            if (isDerivedSignal(derivedSignal)) {
                const updateCycle = useUpdateCycle()
                updateCycle.storeInitialValue(derivedSignal, getWithoutTracking(derivedSignal)) // Order matters. This must be called before mutation occurs
            }
        }
    }
    const oldSize = target[sizeKey];
    const output = fn.apply(target, _args);
    const newSize = target[sizeKey];

    // because we want to compare size, this must happen after mutation, so we need to clone the object beforehand
    if (target instanceof Array || oldSize !== newSize || target instanceof Map && key !== 'set') {
        hasMutated = true;
    }

    if (oldSize !== newSize) {
        hasMutated = true;
        if (sizeProp)
            triggerReactivePrimitive(sizeProp, newSize, oldSize); // trigger for length/size change

        if (target instanceof Array && key === 'pop') {
            const prop = getReactiveProp(reactive, oldSize - 1)
            if (prop)
                triggerReactivePrimitive(prop, undefined, lastItem);
            const op = getTrackableOp(reactive, 'at', oldSize - 1)
            if (op)
                triggerReactivePrimitive(op, undefined, lastItem);
        }
        else if (target instanceof Set && key === 'add') {
            const item = _args[0]
            const op = getTrackableOp(reactive, 'has', item)
            if (op)
                triggerReactivePrimitive(op, true, false)
        }
        else if ((target instanceof Set || target instanceof Map) && key === 'delete') {
            const item = _args[0]
            const op = getTrackableOp(reactive, 'has', item)
            if (op)
                triggerReactivePrimitive(op, false, true)
            if (target instanceof Map) {
                const op = getTrackableOp(reactive, 'get', item)
                if (op)
                    triggerReactivePrimitive(op, undefined, oldMapValue)
            }
        }
        else if ((target instanceof Set || target instanceof Map) && key === 'clear') {
            for (const entry of <Set<any> | Map<any, any>>clone || updateCycle.getSnapshot(reactive)) {
                const item = target instanceof Set ? entry : entry[0]
                const op = getTrackableOp(reactive, 'has', item)
                if (op)
                    triggerReactivePrimitive(op, false, true)
                if (target instanceof Map) {
                    const op = getTrackableOp(reactive, 'get', item)
                    if (op)
                        triggerReactivePrimitive(op, undefined, oldMapValue)
                }
            }
        }
    }

    if (hasMutated) {
        if (isWatched(reactive)) {
            triggerReactiveModel(reactive, {
                target: reactive,
                op: {
                    type: <string>key,
                    args: _args
                }
            }, clone)
        }
        if (isNestedWatched(reactive)) {
            const [rootWatchedModel, keyPath] = getRootWatchedModelAndKeyPath(reactive)
            triggerReactiveModel(rootWatchedModel, {
                target: reactive,
                targetPath: keyPath,
                op: {
                    type: <string>key,
                    args: _args
                }
            }, clone)
        }
    }

    return output;
}

function createReactiveMap(
    target: Map<any, any>,
    register: RegisterReactive,
    deep?: boolean
) {
    const reactiveRef = new Ref<ReactiveModel>()
    let sampleValue: any;

    const reactive = new Proxy(target, {
        get(target, key, receiver) {
            const value = Reflect.get(target, key, receiver);
            if (key === 'get' || key === 'has') {
                return (item: any) =>
                    trackedGetOp(
                        item,
                        reactive,
                        target,
                        key,
                        value
                    );
            }
            if (isMutatingMapMethod(key)) {
                return (...args: any[]) => {
                    // if (!register.mutationPermitted) throw new Error("Object is readonly. It can only be mutated through corresponding `mu` function")
                    return mutatingOp(
                        args,
                        reactive,
                        target,
                        sampleValue,
                        register,
                        key,
                        value
                    )
                }
            }
            if (isNonTrackable(key, Map)) return value;
            if (__DEV__) emitSignal();
            track(asReactiveProp(reactive, key))
            return value;
        },
        set: (target, key, value, receiver) =>
            reactiveSetter(
                Map,
                reactiveRef,
                register,
                target,
                key,
                value,
                receiver
            )
    })
    reactiveRef.o = reactive;

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

// A 'get op' is a o(1) get-like operation like set.has() or array.at()
function trackedGetOp(key: any, reactive: ReactiveModel, target: AnyObject, op: string, fn: (key: any) => any) {
    if (__DEV__) emitSignal();
    if (op === 'at' && key === -1)
        key = target.length - 1;
    track(asTrackableOp(reactive, op, key))
    return fn.call(target, key)
}