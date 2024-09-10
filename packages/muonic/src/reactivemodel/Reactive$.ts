import { AnyObject } from "@rue/types";
import { emitSignal } from "../debug";
import { isPlainObject, isMutatingArrayMethod } from "@rue/utils";
import { isTuple } from "./tuple";
import { asObservedProp } from "./ObservedProp";
import { SnapshotManager } from "./SnapshotManager";
import { asTrackedOp } from "./TrackedOp";
import { getRootWatchedModelAndKeyPath, isNestedWatched } from "../effects/deepWatch";
import { trigger, triggerReactiveAtom, triggerReactiveModel } from "../trigger";
import { asReactiveAtom, isReactiveAtom } from "../derivations/ReactiveAtom";
import { track } from "../derivations/DependencyTracker";
import { useUpdateCycle } from "../effects/UpdateCycle";
import { MutationRecord } from "../effects/deepWatch";
import { MetaReactiveModel, REACTIVE_MODEL_MARKER, ReactiveModel, ReactiveModelContainer } from "./ReactiveModel";
import { asWatchTarget, isWatched } from "../effects/WatchTarget";
import { MetaReactiveCollection } from "./ReactiveCollection";

export enum ReactiveModelDepth {
    SHALLOW = 1,
    DEEP = 2
}


export type Readonly<T extends AnyObject = AnyObject> = {
    readonly [K in keyof T]: T[K]
}

const DEEP = true;

export function isDeepReactive(value: any): value is ReactiveModel {
    return REACTIVE_MODEL_MARKER in value && value[REACTIVE_MODEL_MARKER].deep
}


function _createReactiveModel<T extends AnyObject>(target: T, deep?: boolean): T {
    if (isReactiveModel(target)) return target; // prevents double wrapped reactive

    const reactive = createReactive(target, deep)
    if (reactive === null) {
        if (__DEV__) console.warn(`INVALID INPUT: Reactive$ must receive a reference-type primitive (object)`)
        return target;
    }
    return reactive as T;
}

// return {
export function DeepReactive$<T extends AnyObject>(target: T): ReactiveModel<T> {
    return _createReactiveModel(target, DEEP);
}

export function Reactive$<T extends AnyObject>(target: T): ReactiveModel<T> {
    return _createReactiveModel(target);
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

function storeSnapshot(metaReactive: MetaReactiveModel, clone?: AnyObject) {
    timeTraveler.takeSnapshot(toRaw(metaReactive), useUpdateCycle().count, clone)
}

function recordOp(metaReactive: MetaReactiveModel, op: MutationRecord) {
    useUpdateCycle().recordOp(metaReactive, op)
}

export function isReactiveModel(obj: AnyObject): obj is ReactiveModel {
    return REACTIVE_MODEL_MARKER in obj;
}

export function isReactiveObject(obj: AnyObject): obj is ReactiveModel {
    const raw = toRaw(obj);
    if (raw instanceof Map) return false;
    if (raw instanceof Array) return false;
    if (raw instanceof Set) return false;
    return REACTIVE_MODEL_MARKER in obj;
}

export function toRaw<T extends AnyObject>(target: MetaReactiveModel<T> | ReactiveModel<T> | T): T {
    if (target instanceof MetaReactiveModel) return target.rawTarget;
    if (REACTIVE_MODEL_MARKER in target) return target[REACTIVE_MODEL_MARKER].rawTarget;
    return target; // already raw target
}

function createReactiveObject(
    target: AnyObject,
    deep: boolean = false
) {
    const container = new ReactiveModelContainer(target, deep)
    const metaReactive = container[REACTIVE_MODEL_MARKER];

    const reactive = new Proxy(container, {
        get(_, key, receiver) {
            if (__DEV__) emitSignal();
            const value = Reflect.get(target, key, receiver);
            if (isNonTrackable(key, Object)) {
                return value;
            }
            const descriptor = Reflect.getOwnPropertyDescriptor(target, key);
            if (descriptor?.writable === false) return value;
            track(metaReactive, key);
            return value;
        },
        set: (_, key, value, receiver) =>
            reactiveSetter(
                Object,
                metaReactive,
                target,
                key,
                value,
                receiver
            )
    })
    metaReactive.initReactiveModel(reactive)


    if (deep) {
        for (const key in target) {
            const value = target[key];
            if (!(value instanceof Object)) continue;
            if (isReactiveModel(value)) continue; // prevents double wrapped reactive
            const value$ = createReactive(value, DEEP)
            if (value$ === null) continue;
            target[key] = value$;
        }
    }
    return reactive;
}

function maybeReactivize(
    newValue: any,
    metaReactive: MetaReactiveModel,
    oldValue: any,
) {
    if (isReactiveModel(newValue)) return newValue;
    const reactiveDepth = shouldReactivize(metaReactive, oldValue, newValue);
    return reactiveDepth === ReactiveModelDepth.DEEP ? createReactive(newValue, DEEP)
        : reactiveDepth === ReactiveModelDepth.SHALLOW ? createReactive(newValue)
            : newValue;
}

function createReactive(
    value: any,
    deep?: boolean
): ReactiveModel | null {
    if (isReactiveModel(value)) return value;
    const reactive = isPlainObject(value) ? createReactiveObject(value, deep)
        // : isReactiveCapsule(value) ? createReactive(value.$, register, deep)
        : isTuple(value) ? createReactiveTuple(value, deep)
            : value instanceof Array ? createReactiveArray(value, deep)
                : value instanceof Set ? createReactiveSet(value, deep)
                    : value instanceof Map ? createReactiveMap(value, deep)
                        : null;
    return reactive;
}

// function isReactiveCapsule(value: any): value is { $: AnyObject } {
//     if (!(value instanceof Object) || isPlainObject(value)) return false;
//     if (!('$' in value)) return false;
//     if (!(value.$ instanceof Object)) return false;
//     return true;
// }


function shouldReactivize(
    metaReactive: MetaReactiveModel,
    prevValue: any,
    newValue: any,
): ReactiveModelDepth | false {
    if (!(newValue instanceof Object)) return false;
    if (metaReactive.deep) return ReactiveModelDepth.DEEP;
    if (isReactiveModel(prevValue)) return ReactiveModelDepth.SHALLOW;
    return false;
}


function createReactiveArray(
    target: any[],
    deep: boolean = false
) {
    // const array = target as any[] & { [TRACKED_INDICES]: Set<number> | undefined }
    let sampleValue: any;

    const container = new ReactiveModelContainer(target, deep)
    const metaReactive = container[REACTIVE_MODEL_MARKER]

    const reactive = new Proxy(container, {
        get: (_, key, receiver) =>
            reactiveArrayGetter(
                metaReactive,
                function handleMutatingMethod(key: string, fn) {
                    return (...args: any[]) => {
                        return mutatingArrayOp(
                            args,
                            metaReactive,
                            target,
                            sampleValue,
                            key,
                            fn
                        )
                    }
                },
                target,
                key,
                receiver
            ),
        set: (_, key, value, receiver) =>
            reactiveArraySetter(
                metaReactive,
                target,
                key,
                value,
                receiver
            )

    })
    sampleValue = target[0];
    metaReactive.initReactiveModel(reactive)

    if (deep) {
        createReactiveArrayItems(target)
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
    metaReactive: MetaReactiveModel,
    sampleValue: any,
) {
    if (!(op in insertOps)) return args;

    const itemPosition = insertOps[<keyof typeof insertOps>op]
    const hasSingleItem = 'at' in itemPosition
    const newItems = hasSingleItem ? [args[itemPosition.at]] : args.slice(itemPosition.from);
    const _newItems: any[] = [];
    for (const newItem of newItems) {
        _newItems.push(maybeReactivize(newItem, metaReactive, sampleValue))
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
    deep: boolean = false
) {

    const container = new ReactiveModelContainer(target, deep)
    const metaReactive = container[REACTIVE_MODEL_MARKER]
    const reactive = new Proxy(target, {
        get: (_, key, receiver) =>
            reactiveArrayGetter(
                metaReactive,
                function handleMutatingMethod() {
                    throw new Error("Tuples can only be mutated by index")
                },
                target,
                key,
                receiver
            ),
        set: (_, key, value, receiver) =>
            reactiveArraySetter(
                metaReactive,
                target,
                key,
                value,
                receiver
            )
    })
    metaReactive.initReactiveModel(reactive)

    if (deep) {
        createReactiveArrayItems(target)
    }
    return reactive;
}

export function toWatchedProp(metaReactive: MetaReactiveModel, key: PropertyKey) {
    if (toRaw(metaReactive) instanceof Array && isIntegerKey(key)) {
        const metaArray = <MetaReactiveCollection>metaReactive
        metaArray.addObservedEntryKey(key)

        // clean up
        const prop = asObservedProp(metaReactive, key)
        const watchTarget = asWatchTarget(prop)
        watchTarget.onUnwatched(() => {
            untrackIndex(metaArray, key)
        })
        return prop;
    }
    return asObservedProp(metaReactive, key)
}


function untrackIndex(metaReactive: MetaReactiveCollection, key: PropertyKey) {
    const prop = asObservedProp(metaReactive, key)
    const watchTarget = asWatchTarget(prop)
    const atom = asReactiveAtom(prop)
    if (watchTarget.watchCount === 0 && atom.derivations.size === 0) {
        metaReactive.deleteObservedEntryKey(key)
    }
}



function reactiveArrayGetter(
    metaReactive: MetaReactiveCollection,
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
            metaReactive,
            target,
            key,
            value
        )
    }

    const tracked = track(metaReactive, key)
    if (tracked && isIntegerKey(key)) {
        metaReactive.addObservedEntryKey(key)

        // clean up when untracked
        const prop = asObservedProp(metaReactive, key)
        const atom = asReactiveAtom(prop)
        atom.onUntracked(() => untrackIndex(metaReactive, key))
    }
    return value;
}



function reactiveArraySetter(
    metaReactive: MetaReactiveCollection,
    target: AnyObject,
    key: string | symbol,
    newValue: any,
    receiver: AnyObject
) {
    const op = target instanceof Array && isIntegerKey(key) ? metaReactive.getTrackedOp('at', key) : null;
    const prop = metaReactive.getObservedProp(key);
    if (!prop && !op) {
        Reflect.set(target, key, newValue, receiver);
        return true;
    }
    const oldValue = Reflect.get(target, key, receiver);
    if (oldValue === newValue || isNonTrackable(key, Array)) {
        Reflect.set(target, key, newValue, receiver);
        return true;
    }

    const _newValue = maybeReactivize(newValue, metaReactive, oldValue)

    Reflect.set(target, key, _newValue, receiver);

    storeSnapshot(metaReactive)

    if (prop) {
        trigger(prop)
    }

    if (op) {
        triggerReactiveAtom(op)
    }

    const trackedIndices = metaReactive.observedEntryKeys
    if (trackedIndices && key === 'length') {
        for (const indexKey of trackedIndices) {
            if (typeof indexKey !== 'string') {
                console.warn(`index key is not string. May need to refactor code`)
                continue;
            }
            const index = parseInt(indexKey)
            if (index > _newValue || index > oldValue) {
                const prop = metaReactive.getObservedProp(indexKey)
                if (prop) {
                    trigger(prop)
                }
                const op = metaReactive.getTrackedOp('at', index)
                if (op) {
                    if (isReactiveAtom(op)) {
                        triggerReactiveAtom(op)
                    }
                }
            }
        }
    }

    triggerReactiveWithSetOp(
        metaReactive,
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
    metaReactive: MetaReactiveModel,
    target: AnyObject,
    key: string | symbol,
    newValue: any,
    receiver: AnyObject
) {
    const prop = metaReactive.getObservedProp(key);
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

    const _newValue = maybeReactivize(newValue, metaReactive, oldValue)

    Reflect.set(target, key, _newValue, receiver);

    storeSnapshot(metaReactive)

    if (prop) {
        trigger(prop)
    }

    triggerReactiveWithSetOp(
        metaReactive,
        key,
        _newValue,
        oldValue,
    )

    return true;
}


function triggerReactiveWithSetOp(
    metaReactive: MetaReactiveModel,
    key: string | symbol,
    newValue: any,
    oldValue: any,
) {

    if (isWatched(metaReactive)) {
        recordOp(metaReactive, {
            target: metaReactive.reactiveModel,
            op: {
                type: '[[set]]',
                key,
                newValue: newValue,
                oldValue
            }
        })

        triggerReactiveModel(metaReactive)
    }

    if (isNestedWatched(metaReactive)) {
        const [rootWatchedModel, keyPath] = getRootWatchedModelAndKeyPath(metaReactive)
        recordOp(rootWatchedModel, {
            target: metaReactive.reactiveModel,
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
) {
    for (let i = 0; i < target.length; i++) {
        const item = target[i]
        if (isReactiveModel(item)) continue;
        if (!(item instanceof Object)) continue;
        const item$ = createReactive(item, DEEP)
        if (item$ === null) continue;
        target[i] = item$;
    }
}


function createReactiveSet(
    target: Set<any>,
    deep: boolean = false
) {
    let sampleValue: any;

    const container = new ReactiveModelContainer(target, deep);
    const metaReactive = container[REACTIVE_MODEL_MARKER]

    const reactive = new Proxy(container, {
        get: (_, key: string, receiver: Set<any>) => {
            if (__DEV__) emitSignal()
            const value = Reflect.get(target, key, receiver);
            if (isNonTrackable(key, Set)) return value;

            switch (key) {
                case 'has':
                    return useGetOp(
                        metaReactive,
                        target,
                        key,
                        value
                    );

                case 'add':
                    return addOp

                case 'clear':
                    return useClearOp(metaReactive, target)

                case 'delete':
                    return useDeleteOp(metaReactive, target)

                default:
                    track(metaReactive, key)
                    return value;
            }
        }
    })
    metaReactive.initReactiveModel(reactive)

    function addOp(newValue: any) {

        const oldSize = target.size
        const _newValue = maybeReactivize(newValue, metaReactive, sampleValue)
        const output = target.add(_newValue); //perform op
        const newSize = target.size

        if (oldSize === newSize) return;

        storeSnapshot(metaReactive)

        const sizeProp = metaReactive.getObservedProp('size')
        if (sizeProp)
            trigger(sizeProp);

        const hasOp = metaReactive.getTrackedOp('has', _newValue)
        if (hasOp) triggerReactiveAtom(hasOp);

        triggerReactiveWithMutatinOp(
            metaReactive,
            'add',
            [_newValue]
        )

        return output;
    }

    const values = Array.from(target);
    sampleValue = values[0];

    if (deep) {
        createReactiveArrayItems(values)
        target.clear();
        for (const value of values) {
            target.add(value);
        }
    }
    return reactive;
}



function useDeleteOp(
    metaReactive: MetaReactiveModel,
    target: AnyObject
) {
    return function deleteOp(key: any) {

        const oldSize = target.size
        const output = target.delete(key); //perform op
        const newSize = target.size

        if (oldSize === newSize) return;

        storeSnapshot(metaReactive)

        const sizeProp = metaReactive.getObservedProp('size')
        if (sizeProp)
            trigger(sizeProp);

        const hasOp = metaReactive.getTrackedOp('has', key)
        if (hasOp) triggerReactiveAtom(hasOp);

        if (target instanceof Map) {
            const getOp = metaReactive.getTrackedOp('get', key)
            if (getOp) triggerReactiveAtom(getOp);
        }

        triggerReactiveWithMutatinOp(
            metaReactive,
            'delete',
            [key]
        )

        return output;
    }
}



function useClearOp(
    metaReactive: MetaReactiveCollection,
    target: AnyObject,
) {
    return function clearOp(key: any) {

        const oldSize = target.size
        const output = target.delete(key); //perform op
        const newSize = target.size

        if (oldSize === newSize) return;

        storeSnapshot(metaReactive)

        const trackedEntries = metaReactive.observedEntryKeys
        if (trackedEntries) {
            for (const entryKey of trackedEntries) {
                const hasOp = metaReactive.getTrackedOp('has', entryKey)
                if (hasOp) triggerReactiveAtom(hasOp);

                if (target instanceof Map) {
                    const getOp = metaReactive.getTrackedOp('get', entryKey)
                    if (getOp) triggerReactiveAtom(getOp);
                }
            }
        }

        const sizeProp = metaReactive.getObservedProp('size')
        if (sizeProp)
            trigger(sizeProp);

        const hasOp = metaReactive.getTrackedOp('has', key)
        if (hasOp) triggerReactiveAtom(hasOp);

        if (target instanceof Map) {
            const getOp = metaReactive.getTrackedOp('get', key)
            if (getOp) triggerReactiveAtom(getOp);
        }

        triggerReactiveWithMutatinOp(
            metaReactive,
            'delete',
            [key]
        )

        return output;
    }
}





function mutatingArrayOp(
    args: any[],
    metaReactive: MetaReactiveModel,
    target: AnyObject,
    sampleValue: any,
    key: string,
    fn: Function
) {
    const _args = maybeReactivizeArgs(key, args, metaReactive, sampleValue);

    const oldLength = target.length;
    const output = fn.apply(target, _args); // perform mutation
    const newLength = target.length;

    if (oldLength === newLength) return output; //FIX: Some methods will mutate but not change the length, like fill

    storeSnapshot(metaReactive)

    const lengthProp = metaReactive.getObservedProp('length')
    if (lengthProp) {
        trigger(lengthProp); // trigger for length change
    }

    if (key === 'pop') {
        const prop = metaReactive.getObservedProp((oldLength - 1).toString())
        if (prop) trigger(prop);
        const op = metaReactive.getTrackedOp('at', - 1)
        if (op) triggerReactiveAtom(op);
    }

    triggerReactiveWithMutatinOp(
        metaReactive,
        key,
        _args
    )

    return output;
}


function triggerReactiveWithMutatinOp(
    metaReactive: MetaReactiveModel,
    key: string,
    args: any[]
) {
    if (isWatched(metaReactive)) {
        triggerReactiveModel(metaReactive)
        recordOp(metaReactive, {
            target: metaReactive.reactiveModel,
            op: {
                type: key,
                args
            }
        })
    }

    if (isNestedWatched(metaReactive)) {
        const [rootWatchedModel, keyPath] = getRootWatchedModelAndKeyPath(metaReactive)

        recordOp(rootWatchedModel, {
            target: metaReactive.reactiveModel,
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
    deep: boolean = false
) {
    let sampleValue: any;

    const container = new ReactiveModelContainer(target, deep)
    const metaReactive = container[REACTIVE_MODEL_MARKER];

    const reactive = new Proxy(container, {
        get(_, key, receiver) {
            if (__DEV__) emitSignal()
            const value = Reflect.get(target, key, receiver);
            if (isNonTrackable(key, Map)) return value;
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
                    return useClearOp(metaReactive, target)

                case 'delete':
                    return useDeleteOp(metaReactive, target)


                default:
                    track(metaReactive, key)
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

        if (oldSize !== newSize) {
            const sizeProp = metaReactive.getObservedProp('size')
            if (sizeProp)
                trigger(sizeProp);
        }

        const hasOp = metaReactive.getTrackedOp('has', key)
        if (hasOp) triggerReactiveAtom(hasOp);
        const getOp = metaReactive.getTrackedOp('get', key)
        if (getOp) triggerReactiveAtom(getOp);

        triggerReactiveWithMutatinOp(
            metaReactive,
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
function useGetOp(
    metaReactive: MetaReactiveCollection,
    target: AnyObject,
    op: string,
    fn: (key: any) => any,
) {
    return function getOp(arg: any) {
        if (__DEV__) emitSignal();
        const tracked = track(metaReactive, op, arg)
        if (tracked) {
            metaReactive.addObservedEntryKey(arg)

            // clean up when untracked
            const trackableOp = asTrackedOp(metaReactive, op, arg)
            const atom = asReactiveAtom(trackableOp)
            atom.onUntracked(() => {
                if (atom.derivations.size === 0) {
                    metaReactive.deleteObservedEntryKey(arg)
                }
            })
        }
        return fn.call(target, arg)
    }
}