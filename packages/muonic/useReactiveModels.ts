import { AnyObject } from "@rue/types";
import { storeInitialDerivedValueIfNeeded, track, trigger, useUpdateCycle } from "./watch";
import { emitSignal } from "./useReactivity";
import { isObjectLiteral, KeyPath, Ref } from "@rue/utils";
import { isTuple, tuple } from "./Tuple";
import { asReactiveProp } from "./ReactiveProp";
import { getCurrentUpdateCycle, setCurrentUpdateCycle, UpdateCycle } from "./UpdateCycle";

export type ReactiveModel<T extends AnyObject = AnyObject> = T
type RegisterReactive = (reactive: ReactiveModel, target: AnyObject) => void

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

    function _o$(target: AnyObject, deep?: boolean) {
        if (reactiveMap.has(target)) return target; // prevents double wrapped reactive

        const reactive = createReactive(target, registerReactive, mutationPermitted, deep)
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
    registerReactive: RegisterReactive,
    mutationPermitted: Ref<boolean>,
    deep?: boolean
) {
    const reactiveRef = new Ref<ReactiveModel>()
    const reactive = new Proxy(target, {
        get(target, key, receiver) {
            const value = Reflect.get(target, key, receiver);
            if (isNonTrackable(key, Object)) return value;
            const descriptor = Reflect.getOwnPropertyDescriptor(target, key);
            if (descriptor?.writable === false) return value;
            emitSignal();
            track(reactive, key);
            return value;
        },
        set: createReactiveSetter(
            Object,
            reactiveRef,
            registerReactive,
            mutationPermitted
        )
    })
    reactiveRef.o = reactive;

    if (deep) {
        for (const key in target) {
            const value = target[key];
            if (!(value instanceof Object)) continue;
            if (reactiveMap.has(value)) continue; // prevents double wrapped reactive
            const value$ = createReactive(value, registerReactive, mutationPermitted, DEEP)
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
    registerReactive: RegisterReactive,
    mutationPermitted: Ref<boolean>,
) {
    if (reactiveMap.has(newValue)) return newValue;
    const reactiveDepth = shouldReactivize(reactive, oldValue, newValue);
    return reactiveDepth === O$$$DEPTH ? createReactive(newValue, registerReactive, mutationPermitted, DEEP)
        : reactiveDepth === O$DEPTH ? createReactive(newValue, registerReactive, mutationPermitted)
            : newValue;
}

function createReactive(
    value: any,
    registerReactive: RegisterReactive,
    mutationPermitted: Ref<boolean>,
    deep?: boolean
) {
    if (reactiveMap.has(value)) return value;
    const reactive = isObjectLiteral(value) ? createReactiveObject(value, registerReactive, mutationPermitted, deep)
        : isTuple(value) ? createReactiveTuple(value, registerReactive, mutationPermitted, deep)
            : value instanceof Array ? createReactiveArray(value, registerReactive, mutationPermitted, deep)
                : value instanceof Set ? createReactiveSet(value, registerReactive, mutationPermitted, deep)
                    : value instanceof Map ? createReactiveMap(value, registerReactive, mutationPermitted, deep)
                        : null;
    if (reactive) {
        registerReactive(reactive, value);
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
    registerReactive: RegisterReactive,
    mutationPermitted: Ref<boolean>,
    deep?: boolean
) {
    const sampleValueRef = new Ref<any>();
    const reactiveRef = new Ref<ReactiveModel>();

    const reactive = new Proxy(target, {
        get: createReactiveArrayGetter(
            reactiveRef,
            useMutatingMethodHandler(
                reactiveRef,
                target,
                sampleValueRef,
                registerReactive,
                mutationPermitted
            )
        ),
        set: createReactiveSetter(
            Array,
            reactiveRef,
            registerReactive,
            mutationPermitted
        )
    })
    sampleValueRef.o = reactive[0];
    reactiveRef.o = reactive;

    if (deep) {
        createReactiveArrayItems(target, registerReactive, mutationPermitted)
    }
    return reactive;
}

function isNonTrackable(key: PropertyKey, DataStructure: typeof Array | typeof Set | typeof Map | typeof Object) {
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
    at: true, // item = at(index)

    find: true, // item = find(callbackFn, thisArg?)
    findLast: true, // item = findLast(callbackFn, thisArg?)
        
    findIndex: true, // index = findIndex(callbackFn, thisArg?)
    findLastIndex: true, // index = findLastIndex(callbackFn, thisArg?)
    
    lastIndexOf: true, // index = lastIndexOf(item, fromIndex)
    indexOf: true, // index = indexOf(item, fromIndex)
    
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
    
    includes: true, // boolean = includes(searchElement, fromIndex?)
    every: true, // boolean = every(callbackFn, thisArg?)
    some: true, // boolean = some(callbackFn, thisArg?)
    
    reduce: true, // result = reduce(callbackFn, initialValue?)
    reduceRight: true, // result = reduceRight(callbackFn, initialValue?)
    
    toReversed: true, // newArray = toReversed()
    flat: true, // newArray = flat(depth?)

    slice: true, // newArray = slice(start?, end?)
    concat: true, // newArray = concat(arrayB, arrayC, ...)
    toSorted: true, // newArray = toSorted(compareFn?)
    toSpliced: true, // newArray = toSpliced(start?, deleteCount?, item1, item2, /* …, */ itemN)
    with: true, // newArray = arrayInstance.with(index, value)
    
    filter: true, // newArray = filter(callbackFn, thisArg?)
    flatMap: true, // newArray = flatMap(callbackFn, thisArg?)
    map: true, // newArray = map(callbackFn, thisArg?)
    
    join: true, // string = join(separator?)
    toLocaleString: true, // string = toLocaleString()
    toString: true, // string = toString()
}

const trackableMapOps = {
    get: true, // value = get(key)
    has: true, // boolean = has(key)
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
    has: true, // boolean = has(item)

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
    push: true,
    pop: true,
    shift: true,
    unshift: true,
    splice: true,
    sort: true,
    reverse: true,
    copyWithin: true,
    fill: true
};

const mutatingSetOps = {
    add: true,
    delete: true,
    clear: true
}

const mutatingMapOps = {
    delete: true,
    set: true,
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


// function isIntegerKey(key: unknown) {
//     const keyAsNumber = Number(key);
//     if (isNaN(keyAsNumber)) return false;
//     if (Number.isInteger(keyAsNumber)) return true
// }

function maybeReactivizeArgs(
    op: string,
    args: any[],
    reactive: ReactiveModel,
    sampleValue: any,
    registerReactive: RegisterReactive,
    mutationPermitted: Ref<boolean>
) {
    if (!(op in insertOps)) return args;

    const itemPosition = insertOps[<keyof typeof insertOps>op]
    const hasSingleItem = 'at' in itemPosition
    const newItems = hasSingleItem ? [args[itemPosition.at]] : args.slice(itemPosition.from);
    const _newItems: any[] = [];
    for (const newItem of newItems) {
        _newItems.push(maybeReactivize(newItem, reactive, sampleValue, registerReactive, mutationPermitted))
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
    registerReactive: RegisterReactive,
    mutationPermitted: Ref<boolean>,
    deep?: boolean
) {
    const reactiveRef = new Ref<ReactiveModel>();

    const reactive = new Proxy(target, {
        get: createReactiveArrayGetter(reactiveRef, () => {
            throw new Error("Tuples can only be mutated by index")
        }),
        set: createReactiveSetter(Array, reactiveRef, registerReactive, mutationPermitted)
    })

    reactiveRef.o = reactive;

    if (deep) {
        createReactiveArrayItems(target, registerReactive, mutationPermitted)
    }
    return reactive;
}

function createReactiveArrayGetter(reactiveRef: Ref<ReactiveModel>, handleMutatingMethod: (key: string, fn: Function) => { [key: string]: (...args: any[]) => any }) {
    return function get(target: any[], key: string, receiver: any[]) {
        const value = Reflect.get(target, key, receiver);
        if (isMutatingArrayOps(key)) {
            return handleMutatingMethod(key, value)[key];
        }
        if (isNonTrackable(key, Array)) return value;
        emitSignal();
        track(reactiveRef.o!, key)
        return value;
    }
}

function createReactiveSetter(DataStructure: typeof Array | typeof Object | typeof Set | typeof Map, reactiveRef: Ref<ReactiveModel>, registerReactive: RegisterReactive, mutationPermitted: Ref<boolean>) {
    return function set(target: AnyObject, key: string, newValue: any, receiver: AnyObject) {
        if (!mutationPermitted.o) throw new Error("Object is readonly. It can only be mutated through corresponding `mu` function")
        const oldValue = Reflect.get(target, key, receiver);
        if (oldValue === newValue || isNonTrackable(key, DataStructure) || isNonSettable(key, DataStructure)) {
            Reflect.set(target, key, newValue, receiver);
            return true;
        }
        const reactive = reactiveRef.o!
        const _newValue = maybeReactivize(newValue, reactive, oldValue, registerReactive, mutationPermitted)
        const updateCycle = trigger(reactive, _newValue, oldValue, key)
        storeInitialDerivedValueIfNeeded(updateCycle, reactive, key)
        Reflect.set(target, key, _newValue, receiver);
        return true;
    }
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
    registerReactive: RegisterReactive,
    mutationPermitted: Ref<boolean>
) {
    for (let i = 0; i < target.length; i++) {
        const item = target[i]
        if (reactiveMap.has(item)) continue;
        if (!(item instanceof Object)) continue;
        const item$ = createReactive(item, registerReactive, mutationPermitted, DEEP)
        if (item$ === null) continue;
        target[i] = item$;
    }
}



function createReactiveSet(
    target: Set<any>,
    registerReactive: RegisterReactive,
    mutationPermitted: Ref<boolean>, deep?: boolean
) {
    let sampleValueRef = new Ref<any>();;
    const reactiveRef = new Ref<ReactiveModel>();

    const reactive = new Proxy(target, {
        get: (target: Set<any>, key: string, receiver: Set<any>) => {
            const value = Reflect.get(target, key, receiver);
            if (key in mutatingSetOps) {
                return useMutatingMethodHandler(
                    reactiveRef,
                    target,
                    sampleValueRef,
                    registerReactive,
                    mutationPermitted
                )(key, value)[key]
            }
            if (isNonTrackable(key, Set)) return value;
            emitSignal();
            track(reactive, key)
            return value;
        }
    })

    reactiveRef.o = reactive;

    const values = Array.from(target);
    sampleValueRef.o = values[0];

    if (deep) {
        createReactiveArrayItems(values, registerReactive, mutationPermitted)
        target.clear();
        for (const value of values) {
            target.add(value);
        }
    }
    return reactive;
}

function useMutatingMethodHandler(
    reactiveRef: Ref<ReactiveModel>,
    target: AnyObject,
    sampleValueRef: Ref<any>,
    registerReactive: RegisterReactive,
    mutationPermitted: Ref<boolean>
) {
    return (key: string, fn: Function) => {
        if (!mutationPermitted.o) throw new Error("Object is readonly. It can only be mutated through corresponding `mu` function")

        return { // return an object with key so that function will have a name (for dev purposes)
            [key]: (...args: any[]) => {
                const reactive = reactiveRef.o!;
                const _args = maybeReactivizeArgs(<string>key, args, reactive, sampleValueRef.o!, registerReactive, mutationPermitted);
                const updateCycle = useUpdateCycle();

                if (target instanceof Map && key === 'set') {
                    const oldValue = target.get(args[0]);
                    const newValue = args[1];
                    if (oldValue !== newValue) {
                        trigger(reactive, target, target, key, args);
                    }
                }

                const sizeKey = target instanceof Array ? 'length' : 'size';
                storeInitialDerivedValueIfNeeded(updateCycle, reactive, sizeKey); // Order matters. This must be called before mutation occurs
                const oldSize = reactive[sizeKey];
                const output = fn.apply(target, args);
                const newSize = reactive[sizeKey];


                if (target instanceof Array || oldSize !== newSize || target instanceof Map && key !== 'set') {
                    trigger(reactive, target, target, key, args); // trigger for mutation (only trigger for sets and maps if size changed)
                }

                if (oldSize !== newSize) {
                    trigger(reactive, newSize, oldSize, sizeKey); // trigger for length/size change
                }
                return output;
            }
        }
    }
}


function createReactiveMap(
    target: Map<any, any>,
    registerReactive: RegisterReactive,
    mutationPermitted: Ref<boolean>,
    deep?: boolean
) {
    const reactiveRef = new Ref<ReactiveModel>()
    const sampleValueRef = new Ref<[any, any]>()

    const reactive = new Proxy(target, {
        get(target, key, receiver) {
            const value = Reflect.get(target, key, receiver);
            if (key === 'get') {
                return (mapKey: any) => {
                    const mapValue = value.call(target, mapKey)
                    emitSignal();
                    track(reactive, mapKey)
                    return mapValue;
                }
            }
            if (key in mutatingMapOps) {
                return useMutatingMethodHandler(
                    reactiveRef,
                    target,
                    sampleValueRef,
                    registerReactive,
                    mutationPermitted
                )(<string>key, value)[<string>key]
            }
            if (isNonTrackable(key, Map)) return value;
            emitSignal();
            track(reactive, key)
            return value;
        },
        set: createReactiveSetter(
            Map,
            reactiveRef,
            registerReactive,
            mutationPermitted
        )
    })
    const entries = Array.from(target)

    reactiveRef.o = reactive;
    sampleValueRef.o = entries[0]

    if (deep) {
        throw new Error("Deep has not been implemented for reactive maps!") //TODO: implement if needed
        // for (let i = 0; i < entries.length; i++) {
        //     const [key, value] = entries[i];
        //     if (reactiveMap.has(item)) continue;
        //     if (!(item instanceof Object)) continue;
        //     const item$ = createReactive(item, registerReactive, mutationPermitted, DEEP)
        //     if (item$ === null) continue;
        //     target[i] = item$;
        // }
        // target.clear()
        // loop through entries and target.set(key, value)
    }
    return reactive;
}