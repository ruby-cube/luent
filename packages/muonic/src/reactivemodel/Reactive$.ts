import { AnyObject } from "@rue/types";
import { emitSignal } from "../debug";
import { isPlainObject, isMutatingArrayMethod } from "@rue/utils";
import { isTuple } from "./tuple";
import { asReactiveProp, getReactiveProp } from "./ReactiveProp";
import { SnapshotManager } from "./SnapshotManager";
import { asTrackableOp, getTrackableOp } from "./TrackableOp";
import { getRootWatchedModelAndKeyPath, isNestedWatched } from "../effects/deepWatch";
import { trigger, triggerReactiveAtom, triggerReactiveModel } from "../trigger";
import { asWatchTarget, isWatched } from "../effects/watch";
import { asReactiveAtom, isReactiveAtom } from "../derivations/ReactiveAtom";
import { track } from "../derivations/DependencyTracker";
import { useUpdateCycle } from "../effects/UpdateCycle";
import { MutationRecord } from "../effects/deepWatch";

export type ReactiveModel<T extends AnyObject = AnyObject> = T
export enum ReactiveModelDepth {
    SHALLOW = 1,
    DEEP = 2
}

type RegisterReactive = (reactive: ReactiveModel, target: AnyObject, deep: boolean | undefined) => void

export type Readonly<T extends AnyObject = AnyObject> = {
    readonly [K in keyof T]: T[K]
}

const reactiveMap: WeakMap<ReactiveModel, AnyObject> = new WeakMap();
const deepReactives: WeakSet<ReactiveModel> = new WeakSet();
const DEEP = true;

function register(reactive: ReactiveModel, target: AnyObject, deep: boolean | undefined) {
    reactiveMap.set(reactive, target);
    if (deep) deepReactives.add(reactive)
}

export function isDeepReactive(value: any): value is ReactiveModel {
    return deepReactives.has(value);
}


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

const timeTraveler = new SnapshotManager()

function storeSnapshot(reactive: ReactiveModel, clone?: AnyObject) {
    timeTraveler.takeSnapshot(toRaw(reactive), useUpdateCycle().count, clone)
}

function recordOp(reactive: ReactiveModel, op: MutationRecord) {
    useUpdateCycle().recordOp(reactive, op)
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
    register: RegisterReactive,
    deep?: boolean
) {
    let reactive: ReactiveModel // prevents circular reference in proxy definition

    const _reactive = new Proxy(target, {
        get(target, key, receiver) {
            if (__DEV__) emitSignal();
            const value = Reflect.get(target, key, receiver);
            if (isNonTrackable(key, Object)) {
                return value;
            }
            const descriptor = Reflect.getOwnPropertyDescriptor(target, key);
            if (descriptor?.writable === false) return value;
            track(reactive, key);
            return value;
        },
        set: (target, key, value, receiver) =>
            reactiveSetter(
                Object,
                reactive,
                register,
                target,
                key,
                value,
                receiver
            )
    })
    reactive = _reactive;

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
    return reactiveDepth === ReactiveModelDepth.DEEP ? createReactive(newValue, register, DEEP)
        : reactiveDepth === ReactiveModelDepth.SHALLOW ? createReactive(newValue, register)
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
): ReactiveModelDepth | false {
    if (!(newValue instanceof Object)) return false;
    if (deepReactives.has(target)) return ReactiveModelDepth.DEEP;
    if (reactiveMap.has(prevValue)) return ReactiveModelDepth.SHALLOW;
    return false;
}

const TRACKED_INDICES = 'x__trackedIndices'

function createReactiveArray(
    target: any[],
    register: RegisterReactive,
    deep?: boolean
) {
    const array = target as any[] & { [TRACKED_INDICES]: Set<number> | undefined }
    let sampleValue: any;

    let reactive: ReactiveModel // prevents self-referencing in setter
    const _reactive = new Proxy(target, {
        get: (target, key, receiver) =>
            reactiveArrayGetter(
                reactive,
                function getTrackedIndices() {
                    if (array[TRACKED_INDICES])
                        return array[TRACKED_INDICES]
                    array[TRACKED_INDICES] = new Set()
                    return array[TRACKED_INDICES];
                },
                function handleMutatingMethod(key: string, fn) {
                    return (...args: any[]) => {
                        return mutatingArrayOp(
                            args,
                            reactive,
                            target,
                            sampleValue,
                            register,
                            key,
                            fn
                        )
                    }
                },
                target,
                key,
                receiver
            ),
        set: (target, key, value, receiver) =>
            reactiveArraySetter(
                reactive,
                array[TRACKED_INDICES],
                register,
                target,
                key,
                value,
                receiver
            )

    })
    reactive = _reactive;
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
    const tuple = target as any[] & { [TRACKED_INDICES]: Set<number> | undefined }
    let reactive: ReactiveModel;
    const _reactive = new Proxy(target, {
        get: (target, key, receiver) =>
            reactiveArrayGetter(
                reactive,
                function getTrackedIndices() {
                    if (tuple[TRACKED_INDICES])
                        return tuple[TRACKED_INDICES]
                    tuple[TRACKED_INDICES] = new Set()
                    return tuple[TRACKED_INDICES];
                },
                function handleMutatingMethod() {
                    throw new Error("Tuples can only be mutated by index")
                },
                target,
                key,
                receiver
            ),
        set: (target, key, value, receiver) =>
            reactiveArraySetter(
                reactive,
                tuple[TRACKED_INDICES],
                register,
                target,
                key,
                value,
                receiver
            )
    })
    reactive = _reactive

    if (deep) {
        createReactiveArrayItems(target, register)
    }
    return reactive;
}

export function toWatchedProp(target: ReactiveModel, key: PropertyKey) {
    if (toRaw(target) instanceof Array && isIntegerKey(key)) {
        target[TRACKED_INDICES].add(parseInt(<string>key))

        // clean up
        const prop = asReactiveProp(target, key)
        const watchTarget = asWatchTarget(prop)
        watchTarget.onUnwatched(()=>{
            untrackIndex(target, key)
        })
        return prop;
    }
    return asReactiveProp(target, key)
}


function untrackIndex(target: ReactiveModel, key: PropertyKey) {
    const prop = asReactiveProp(target, key)
    const watchTarget = asWatchTarget(prop)
    const atom = asReactiveAtom(prop)
    if (watchTarget.watchCount === 0 && atom.derivations.size === 0) {
        target[TRACKED_INDICES].delete(parseInt(<string>key))
    }
}



function reactiveArrayGetter(
    reactive: ReactiveModel,
    getTrackedIndices: () => Set<number>,
    handleMutatingMethod: (key: string, fn: Function) => (...args: any[]) => any,
    target: any[],
    key: string | symbol,
    receiver: any[]
) {
    if (__DEV__) emitSignal();
    const value = Reflect.get(target, key, receiver);
    if (isMutatingArrayMethod(key)) {
        return handleMutatingMethod(<string>key, value);
    }
    if (isNonTrackable(key, Array)) return value;
    if (key === 'at') {
        return useGetOp(
            reactive,
            target,
            key,
            value,
            getTrackedIndices
        )
    }

    const tracked = track(reactive, key)
    if (tracked && isIntegerKey(key)) {
        getTrackedIndices().add(parseInt(<string>key))

        // clean up when untracked
        const prop = asReactiveProp(reactive, key)
        const atom = asReactiveAtom(prop)
        const cleanUp = () => untrackIndex(reactive, key)
        atom.onUntracked(cleanUp)
    }
    return value;
}


function reactiveArraySetter(
    reactive: ReactiveModel,
    trackedIndices: Set<number> | undefined,
    register: RegisterReactive,
    target: AnyObject,
    key: string | symbol,
    newValue: any,
    receiver: AnyObject
) {
    const op = target instanceof Array && isIntegerKey(key) ? getTrackableOp(reactive, 'at', key) : null;
    const prop = getReactiveProp(reactive, key);
    if (!prop && !op) {
        Reflect.set(target, key, newValue, receiver);
        return true;
    }
    const oldValue = Reflect.get(target, key, receiver);
    if (oldValue === newValue || isNonTrackable(key, Array)) {
        Reflect.set(target, key, newValue, receiver);
        return true;
    }

    const _newValue = maybeReactivize(newValue, reactive, oldValue, register)

    Reflect.set(target, key, _newValue, receiver);

    storeSnapshot(reactive)

    if (prop) {
        trigger(prop)
    }

    if (op) {
        triggerReactiveAtom(op)
    }

    if (trackedIndices && key === 'length') {
        for (const index of trackedIndices) {
            if (index > _newValue || index > oldValue) {
                const prop = getReactiveProp(reactive, index.toString())
                if (prop) {
                    trigger(prop)
                }
                const op = getTrackableOp(reactive, 'at', index)
                if (op) {
                    if (isReactiveAtom(op)) {
                        triggerReactiveAtom(op)
                    }
                }
            }
        }
    }

    triggerReactiveWithSetOp(
        reactive,
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


function reactiveSetter(
    DataStructure: typeof Array | typeof Object | typeof Map, // and Tuple
    reactive: ReactiveModel,
    register: RegisterReactive,
    target: AnyObject,
    key: string | symbol,
    newValue: any,
    receiver: AnyObject
) {
    const prop = getReactiveProp(reactive, key);
    if (!prop) {
        if (__DEV__) console.warn(`I'm curious if this is even possible--Setting a prop that is not a reactive prop`)
            Reflect.set(target, key, newValue, receiver); //QUESTION: Do I need to pass the newValue through 'maybeReactivize"?
        return true;
    }
    
    const oldValue = Reflect.get(target, key, receiver);
    if (oldValue === newValue
        || isNonTrackable(key, DataStructure)
        || isNonSettable(<string>key, DataStructure)
        || !isWritable(target, key)) { //QUESTION: Are these conditions redundant?
            Reflect.set(target, key, newValue, receiver);
        return true;
    }

    const _newValue = maybeReactivize(newValue, reactive, oldValue, register)

    Reflect.set(target, key, _newValue, receiver);

    storeSnapshot(reactive)

    if (prop) {
        trigger(prop)
    }

    triggerReactiveWithSetOp(
        reactive,
        key,
        _newValue,
        oldValue,
    )

    return true;
}


function triggerReactiveWithSetOp(
    reactive: ReactiveModel,
    key: string | symbol,
    newValue: any,
    oldValue: any,
) {

    if (isWatched(reactive)) {
        recordOp(reactive, {
            target: reactive,
            op: {
                type: '[[set]]',
                key,
                newValue: newValue,
                oldValue
            }
        })

        triggerReactiveModel(reactive)
    }

    if (isNestedWatched(reactive)) {
        const [rootWatchedModel, keyPath] = getRootWatchedModelAndKeyPath(reactive)
        recordOp(rootWatchedModel, {
            target: reactive,
            targetPath: keyPath,
            op: {
                type: '[[set]]',
                key,
                newValue: newValue,
                oldValue
            }
        })

        triggerReactiveModel(rootWatchedModel)
    }
}



function isWritable(target: Object, key: PropertyKey) {
    const descriptor = Reflect.getOwnPropertyDescriptor(target, key);
    if (descriptor?.writable === true) return true;
    return false;
}

// Because insertion of values don't yield differing new and old values for size and length in the setter,
// we need to manually check old and new values at time of mutation
function isNonSettable(key: string, DataStructure: typeof Array | typeof Object | typeof Set | typeof Map) {
    if ((DataStructure === Set || DataStructure === Map) && key === 'size') return true;
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

const TRACKED_ENTRIES = 'x__trackedEntries'

function createReactiveSet(
    target: Set<any>,
    register: RegisterReactive,
    deep?: boolean
) {
    let sampleValue: any;
    const targetSet = target as Set<any> & { [TRACKED_ENTRIES]: Set<any> | undefined }

    const reactive = new Proxy(target, {
        get: (target: Set<any>, key: string, receiver: Set<any>) => {
            if (__DEV__) emitSignal()
            const value = Reflect.get(target, key, receiver);
            if (isNonTrackable(key, Set)) return value;

            switch (key) {
                case 'has':
                    return useGetOp(
                        reactive,
                        target,
                        key,
                        value,
                        function getTrackedEntries() {
                            if (targetSet[TRACKED_ENTRIES])
                                return targetSet[TRACKED_ENTRIES]
                            targetSet[TRACKED_ENTRIES] = new Set()
                            return targetSet[TRACKED_ENTRIES];
                        }
                    );

                case 'add':
                    return addOp

                case 'clear':
                    return useClearOp(reactive, target, () => targetSet[TRACKED_ENTRIES])

                case 'delete':
                    return useDeleteOp(reactive, target)

                default:
                    track(reactive, key)
                    return value;
            }
        }
    })


    function addOp(newValue: any) {

        const oldSize = target.size
        const _newValue = maybeReactivize(newValue, reactive, sampleValue, register)
        const output = target.add(_newValue); //perform op
        const newSize = target.size

        if (oldSize === newSize) return;

        storeSnapshot(reactive)

        const sizeProp = getReactiveProp(reactive, 'size')
        if (sizeProp)
            trigger(sizeProp);

        const hasOp = getTrackableOp(reactive, 'has', _newValue)
        if (hasOp) triggerReactiveAtom(hasOp);

        triggerReactiveWithMutatinOp(
            reactive,
            'add',
            [_newValue]
        )

        return output;
    }

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



function useDeleteOp(
    reactive: ReactiveModel,
    target: AnyObject
) {
    return function deleteOp(key: any) {

        const oldSize = target.size
        const output = target.delete(key); //perform op
        const newSize = target.size

        if (oldSize === newSize) return;

        storeSnapshot(reactive)

        const sizeProp = getReactiveProp(reactive, 'size')
        if (sizeProp)
            trigger(sizeProp);

        const hasOp = getTrackableOp(reactive, 'has', key)
        if (hasOp) triggerReactiveAtom(hasOp);

        if (target instanceof Map) {
            const getOp = getTrackableOp(reactive, 'get', key)
            if (getOp) triggerReactiveAtom(getOp);
        }

        triggerReactiveWithMutatinOp(
            reactive,
            'delete',
            [key]
        )

        return output;
    }
}



function useClearOp(
    reactive: ReactiveModel,
    target: AnyObject,
    getTrackedEntries: () => Set<any> | undefined
) {
    return function clearOp(key: any) {

        const oldSize = target.size
        const output = target.delete(key); //perform op
        const newSize = target.size

        if (oldSize === newSize) return;

        storeSnapshot(reactive)

        const trackedEntries = getTrackedEntries()
        if (trackedEntries) {
            for (const entry of trackedEntries) {
                const hasOp = getTrackableOp(reactive, 'has', entry)
                if (hasOp) triggerReactiveAtom(hasOp);

                if (target instanceof Map) {
                    const getOp = getTrackableOp(reactive, 'get', entry)
                    if (getOp) triggerReactiveAtom(getOp);
                }
            }
        }

        const sizeProp = getReactiveProp(reactive, 'size')
        if (sizeProp)
            trigger(sizeProp);

        const hasOp = getTrackableOp(reactive, 'has', key)
        if (hasOp) triggerReactiveAtom(hasOp);

        if (target instanceof Map) {
            const getOp = getTrackableOp(reactive, 'get', key)
            if (getOp) triggerReactiveAtom(getOp);
        }

        triggerReactiveWithMutatinOp(
            reactive,
            'delete',
            [key]
        )

        return output;
    }
}





function mutatingArrayOp(
    args: any[],
    reactive: ReactiveModel,
    target: AnyObject,
    sampleValue: any,
    register: RegisterReactive,
    key: string,
    fn: Function
) {
    const _args = maybeReactivizeArgs(key, args, reactive, sampleValue, register);

    const oldLength = target.length;
    const output = fn.apply(target, _args); // perform mutation
    const newLength = target.length;
    
    if (oldLength === newLength) return output; //FIX: Some methods will mutate but not change the length, like fill
    
    storeSnapshot(reactive)
    
    const lengthProp = getReactiveProp(reactive, 'length')
    if (lengthProp){
        trigger(lengthProp); // trigger for length change
    }

    if (key === 'pop') {
        const prop = getReactiveProp(reactive, oldLength - 1)
        if (prop) trigger(prop);
        const op = getTrackableOp(reactive, 'at', - 1)
        if (op) triggerReactiveAtom(op);
    }

    triggerReactiveWithMutatinOp(
        reactive,
        key,
        _args
    )

    return output;
}


function triggerReactiveWithMutatinOp(
    reactive: ReactiveModel,
    key: string,
    args: any[]
) {
    if (isWatched(reactive)) {
        triggerReactiveModel(reactive)
        recordOp(reactive, {
            target: reactive,
            op: {
                type: key,
                args
            }
        })
    }

    if (isNestedWatched(reactive)) {
        const [rootWatchedModel, keyPath] = getRootWatchedModelAndKeyPath(reactive)

        recordOp(rootWatchedModel, {
            target: reactive,
            targetPath: keyPath,
            op: {
                type: key,
                args
            }
        })
        triggerReactiveModel(rootWatchedModel)
    }
}

function createReactiveMap(
    target: Map<any, any>,
    register: RegisterReactive,
    deep?: boolean
) {
    const targetMap = target as Map<any, any> & { [TRACKED_ENTRIES]: Set<any> | undefined }
    let sampleValue: any;

    let reactive: ReactiveModel
    const _reactive = new Proxy(target, {
        get(target, key, receiver) {
            if (__DEV__) emitSignal()
            const value = Reflect.get(target, key, receiver);
            if (isNonTrackable(key, Map)) return value;
            switch (key) {
                case 'get':
                case 'has':
                    return useGetOp(
                        reactive,
                        target,
                        key,
                        value,
                        function getTrackedEntries() {
                            if (targetMap[TRACKED_ENTRIES])
                                return targetMap[TRACKED_ENTRIES]
                            targetMap[TRACKED_ENTRIES] = new Set()
                            return targetMap[TRACKED_ENTRIES];
                        }
                    );

                case 'set':
                    return setOp

                case 'clear':
                    return useClearOp(reactive, target, () => targetMap[TRACKED_ENTRIES])

                case 'delete':
                    return useDeleteOp(reactive, target)


                default:
                    track(reactive, key)
                    return value;
            }
        },
        set: (target, key, value, receiver) =>
            reactiveSetter(
                Map,
                reactive,
                register,
                target,
                key,
                value,
                receiver
            )
    })
    reactive = _reactive;


    function setOp(key: any, newValue: any) {
        const oldSize = target.size
        const oldValue = target.get(key);
        const _newValue = maybeReactivize(newValue, reactive, oldValue, register) //FIX: I don't know if relying on oldValue to determine reactivize is reliable. What if user sets value to undefined?
        const output = target.set(key, _newValue); //perform op
        const newSize = target.size

        if (oldValue === _newValue) return;

        storeSnapshot(reactive)

        if (oldSize !== newSize) {
            const sizeProp = getReactiveProp(reactive, 'size')
            if (sizeProp)
                trigger(sizeProp);
        }

        const hasOp = getTrackableOp(reactive, 'has', key)
        if (hasOp) triggerReactiveAtom(hasOp);
        const getOp = getTrackableOp(reactive, 'get', key)
        if (getOp) triggerReactiveAtom(getOp);

        triggerReactiveWithMutatinOp(
            reactive,
            'set',
            [key, _newValue]
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

// A 'get op' is a o(1) get-like operation like set.has() or array.at()
function useGetOp(reactive: ReactiveModel, target: AnyObject, op: string, fn: (key: any) => any, getTrackedEntryKeys: () => Set<number>) {
    return function getOp(arg: any) {
        if (__DEV__) emitSignal();
        const tracked = track(reactive, op, arg)
        if (tracked) {
            const trackedEntryKeys = getTrackedEntryKeys()
            trackedEntryKeys.add(arg)

            // clean up when untracked
            const trackableOp = asTrackableOp(reactive, op, arg)
            const atom = asReactiveAtom(trackableOp)
            atom.onUntracked(() => {
                if (atom.derivations.size === 0) {
                    trackedEntryKeys.delete(arg)
                }
            })
        }
        return fn.call(target, arg)
    }
}