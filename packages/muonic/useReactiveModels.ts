import { AnyObject } from "@rue/types";
import { isWatchedModel, storeInitialDerivedValueIfNeeded, track, trigger, useUpdateCycle } from "./watch";
import { emitSignal } from "./useReactivity";
import { isObjectLiteral, KeyPath, Ref } from "@rue/utils";
import { isTuple, tuple } from "./Tuple";
import { asReactiveProp, getReactiveProp } from "./ReactiveProp";
import { shallowClone } from "./SnapshotManager";
import { asTrackableOp, getTrackableOp } from "./TrackableOp";

export type ReactiveModel<T extends AnyObject = AnyObject> = T
type RegisterReactive = (reactive: ReactiveModel, target: AnyObject) => void
type ReactiveModelRegistry = {
    register: RegisterReactive,
    mutationPermitted: boolean
}

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
    const registry = {
        register(reactive: ReactiveModel, target: AnyObject) {
            localReactives.add(reactive);
            reactiveMap.set(reactive, target);
        },
        mutationPermitted: false,
    }

    function _o$(target: AnyObject, deep?: boolean) {
        if (reactiveMap.has(target)) return target; // prevents double wrapped reactive

        const reactive = createReactive(target, registry, deep)
        if (reactive === null) {
            if (__DEV__) console.warn(`INVALID INPUT: o$ must receive a reference-type primitive (object)`)
            return target;
        }
        return reactive;
    }

    return {
        o$$$<T extends AnyObject>(target: T): ReactiveModel<T> {
            return _o$(target, DEEP);
        },

        o$<T extends AnyObject>(target: T): ReactiveModel<T> {
            return _o$(target);
        },

        mu<T extends ReactiveModel>(target: T, mutation: (o: T) => void) {
            if (!localReactives.has(target)) throw "`mu` can only mutate local reactives created with corresponding `o$` function";
            registry.mutationPermitted = true;
            mutation(target);
            registry.mutationPermitted = false;
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
    registry: ReactiveModelRegistry,
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
                registry,
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
            const value$ = createReactive(value, registry, DEEP)
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
    registry: ReactiveModelRegistry
) {
    if (reactiveMap.has(newValue)) return newValue;
    const reactiveDepth = shouldReactivize(reactive, oldValue, newValue);
    return reactiveDepth === O$$$DEPTH ? createReactive(newValue, registry, DEEP)
        : reactiveDepth === O$DEPTH ? createReactive(newValue, registry)
            : newValue;
}

function createReactive(
    value: any,
    registry: ReactiveModelRegistry,
    deep?: boolean
) {
    if (reactiveMap.has(value)) return value;
    const reactive = isObjectLiteral(value) ? createReactiveObject(value, registry, deep)
        : isTuple(value) ? createReactiveTuple(value, registry, deep)
            : value instanceof Array ? createReactiveArray(value, registry, deep)
                : value instanceof Set ? createReactiveSet(value, registry, deep)
                    : value instanceof Map ? createReactiveMap(value, registry, deep)
                        : null;
    if (reactive) {
        registry.register(reactive, value);
        if (deep) deepReactives.add(reactive)
    }
    return reactive;
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
    registry: ReactiveModelRegistry,
    deep?: boolean
) {
    const reactiveRef = new Ref<ReactiveModel>();
    let sampleValue: any;

    const reactive = new Proxy(target, {
        get: (target, key, receiver) => reactiveArrayGetter(
            reactive,
            (key, fn) => (...args: any[]) => {
                if (!registry.mutationPermitted) throw new Error("Object is readonly. It can only be mutated through corresponding `mu` function")
                return mutatingOp(
                    args,
                    reactive,
                    target,
                    sampleValue,
                    registry,
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
                registry,
                target,
                key,
                value,
                receiver
            )

    })
    reactiveRef.o = reactive;
    sampleValue = reactive[0];

    if (deep) {
        createReactiveArrayItems(target, registry)
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

const mutatingArrayOps = {
    // changes length
    push: true, // will change length
    unshift: true, // will change length

    pop: true, // will change length (unless already empty)
    shift: true, //  will change length (unless already empty)

    splice: true, // may or may not change length (many different cases to check)

    // length will not change (index will change)
    reverse: true, // may or may not change array (no change if length === 0 || 1)
    sort: true, // may or may not change array (no change if length === 0 || 1   or if array already sorted)
    fill: true, // may or may not change array (no change if array already filled with the item or length === 0)
    copyWithin: true, // may or may not change array (no change if items all the same or length === 0)
};

const mutatingSetOps = {
    add: true,
    delete: true,
    clear: true
}

const mutatingMapOps = {
    set: true,
    delete: true,
    clear: true
}

const insertOps = {
    push: { from: 0 },
    unshift: { from: 0 },
    splice: { from: 2 },
    fill: { at: 0 },
    add: { at: 0 },
    set: { from: 0 }
}

function isMutatingArrayOps(key: PropertyKey) {
    if (typeof key !== "string") return false;
    return key in mutatingArrayOps;
}


function isIntegerKey(key: unknown) {
    const keyAsNumber = Number(key);
    if (isNaN(keyAsNumber)) return false;
    if (Number.isInteger(keyAsNumber)) return true
}

function maybeReactivizeArgs(
    op: string,
    args: any[],
    reactive: ReactiveModel,
    sampleValue: any,
    registry: ReactiveModelRegistry
) {
    if (!(op in insertOps)) return args;

    const itemPosition = insertOps[<keyof typeof insertOps>op]
    const hasSingleItem = 'at' in itemPosition
    const newItems = hasSingleItem ? [args[itemPosition.at]] : args.slice(itemPosition.from);
    const _newItems: any[] = [];
    for (const newItem of newItems) {
        _newItems.push(maybeReactivize(newItem, reactive, sampleValue, registry))
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
    registry: ReactiveModelRegistry,
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
                registry,
                target,
                key,
                value,
                receiver
            )
    })
    reactiveRef.o = reactive;

    if (deep) {
        createReactiveArrayItems(target, registry)
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
    if (isMutatingArrayOps(key)) {
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
    registry: ReactiveModelRegistry,
    target: AnyObject,
    key: string | symbol,
    newValue: any,
    receiver: AnyObject
) {
    if (!registry.mutationPermitted) throw new Error("Object is readonly. It can only be mutated through corresponding `mu` function")
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
    const _newValue = maybeReactivize(newValue, reactive, oldValue, registry)

    const updateCycle = useUpdateCycle();

    if (prop) {
        trigger(prop, _newValue, oldValue)
        storeInitialDerivedValueIfNeeded(updateCycle, prop)
    }

    if (op) {
        trigger(op, _newValue, oldValue)
        storeInitialDerivedValueIfNeeded(updateCycle, op)
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
                    trigger(prop, undefined, item)
                }
                const op = getTrackableOp(reactive, 'at', i.toString())
                if (op) {
                    const item = target[i];
                    trigger(op, undefined, item);
                }
            }
        }
        else if (isIntegerKey(key)) {
            const op = getTrackableOp(reactive, 'at', key)
            if (op) {
                const oldValue = target[parseInt(<string>key)]
                trigger(op, _newValue, oldValue);
            }
        }
    }

    if (isWatchedModel(reactive)) {
        // TODO: I need to trigger to flag reactive
        updateCycle.takeSnapshot(reactive, target)
        updateCycle.recordOp(reactive, {
            keyPath: [<string>key],
            newValue: _newValue,
            oldValue
        })
    }

    Reflect.set(target, key, _newValue, receiver);
    return true;
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
    registry: ReactiveModelRegistry
) {
    for (let i = 0; i < target.length; i++) {
        const item = target[i]
        if (reactiveMap.has(item)) continue;
        if (!(item instanceof Object)) continue;
        const item$ = createReactive(item, registry, DEEP)
        if (item$ === null) continue;
        target[i] = item$;
    }
}



function createReactiveSet(
    target: Set<any>,
    registry: ReactiveModelRegistry,
    deep?: boolean
) {
    // const reactiveRef = new Ref<ReactiveModel>();
    let sampleValue: any;

    const reactive = new Proxy(target, {
        get: (target: Set<any>, key: string, receiver: Set<any>) => {
            const value = Reflect.get(target, key, receiver);

            if (key in mutatingSetOps) {
                return (...args: any[]) => {
                    if (!registry.mutationPermitted) throw new Error("Object is readonly. It can only be mutated through corresponding `mu` function")
                    return mutatingOp(
                        args,
                        reactive,
                        target,
                        sampleValue,
                        registry,
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
        createReactiveArrayItems(values, registry)
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
    registry: ReactiveModelRegistry,
    key: string | symbol,
    fn: Function
) {
    const _args = maybeReactivizeArgs(<string>key, args, reactive, sampleValue, registry);
    const updateCycle = useUpdateCycle();
    const clone = shallowClone(target) // cloning before mutation

    const oldMapValue = target instanceof Map && key === 'set' || key === 'clear' || key === 'delete' ? target.get(_args[0]) : null;
    const lastItem = target instanceof Array && key === 'pop' ? target.at(-1) : null

    if (target instanceof Map && key === 'set') {
        const mapKey = _args[0]
        // const oldValue = target.get(mapKey);
        const newValue = _args[1];
        if (oldMapValue !== newValue) {
            if (isWatchedModel(reactive)) {
                // TODO: I need to trigger to flag reactive
                updateCycle.takeSnapshot(reactive, target, clone)
            }
            const hasOp = getTrackableOp(reactive, 'has', mapKey)
            if (hasOp) trigger(hasOp, newValue, oldMapValue);
            const getOp = getTrackableOp(reactive, 'get', mapKey)
            if (getOp) trigger(getOp, newValue, oldMapValue);
        }
    }

    const sizeKey = target instanceof Array ? 'length' : 'size';
    const sizeProp = getReactiveProp(reactive, sizeKey)
    if (sizeProp) {
        storeInitialDerivedValueIfNeeded(updateCycle, sizeProp); // Order matters. This must be called before mutation occurs
    }
    const oldSize = target[sizeKey];
    const output = fn.apply(target, _args);
    const newSize = target[sizeKey];

    // because we want to compare size, this must happen after mutation, so we need to clone the object beforehand
    if (target instanceof Array || oldSize !== newSize || target instanceof Map && key !== 'set') {
        // TODO: I need to trigger to flag reactive
        if (isWatchedModel(reactive)) {
            updateCycle.takeSnapshot(reactive, target, clone);
            updateCycle.recordOp(target, {
                op: <string>key,
                args: _args
            })
        }
    }

    if (oldSize !== newSize) {
        if (sizeProp)
            trigger(sizeProp, newSize, oldSize); // trigger for length/size change
        if (target instanceof Array && key === 'pop') {
            const prop = getReactiveProp(reactive, oldSize - 1)
            if (prop) trigger(prop, undefined, lastItem);
            const op = getTrackableOp(reactive, 'at', oldSize - 1)
            if (op) trigger(op, undefined, lastItem);
        }
        else if (target instanceof Set && key === 'add') {
            const item = _args[0]
            const op = getTrackableOp(reactive, 'has', item)
            if (op) trigger(op, true, false)
        }
        else if ((target instanceof Set || target instanceof Map) && key === 'delete') {
            const item = _args[0]
            const op = getTrackableOp(reactive, 'has', item)
            if (op) trigger(op, false, true)
            if (target instanceof Map) {
                const op = getTrackableOp(reactive, 'get', item)
                if (op) trigger(op, undefined, oldMapValue)
            }
        }
        else if ((target instanceof Set || target instanceof Map) && key === 'clear') {
            for (const entry of target) {
                const item = target instanceof Set ? entry : entry[0]
                const op = getTrackableOp(reactive, 'has', item)
                if (op) trigger(op, false, true)
                if (target instanceof Map) {
                    const op = getTrackableOp(reactive, 'get', item)
                    if (op) trigger(op, undefined, oldMapValue)
                }
            }
        }
    }

    return output;
}

function createReactiveMap(
    target: Map<any, any>,
    registry: ReactiveModelRegistry,
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
            if (key in mutatingMapOps) {
                return (...args: any[]) => {
                    if (!registry.mutationPermitted) throw new Error("Object is readonly. It can only be mutated through corresponding `mu` function")
                    return mutatingOp(
                        args,
                        reactive,
                        target,
                        sampleValue,
                        registry,
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
                registry,
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
        //     const item$ = createReactive(item, registry, DEEP)
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