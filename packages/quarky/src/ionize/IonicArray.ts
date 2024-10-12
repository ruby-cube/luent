import { AnyObject } from "@rue/types";
import { isIonicAtom } from "../derivations/IonicAtom";
import { trigger, triggerIonicAtom, triggerIonicModel } from "../trigger";
import { isIonicModel, IonicModel, storeSnapshot, toRaw, } from "./ionize";
import { getTrackedOp } from "./TrackedOp";
import { defineIonicStructure, GetPreopData, isNonTrackable, setAbsorbedIon, useTrackableGetOp } from "./IonicModel";
import { asTrackedProp, getObservedProp } from "./PropIon";
import { MetaIonicModel } from "./MetaIonicModel";
import { nontrackableIterableKeys } from "./IonicSet";

export const runningIonicArray = true;

const trackableArrayOps = {

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
    // shift: true,
    // unshift: true,
    // reverse: true,
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

defineIonicStructure(Array, {
    nontrackableKeys: nontrackableIterableKeys,

    trackableOps: {
        at(target, ionicModel) {
            return useTrackableGetOp(
                ionicModel,
                target,
                'at',
                target.at
            )
        }
        //TODO: Trackable ops (as oppsed to get ops)?? not sure if necessary yet
    },

    mutatingOps: {
        push: {
            createOp: useMutatingArrayOpFactory('push', deionizeArgs),
            preop(model) {
                return model.length
            },
            revert(model, { preopData: length, args }) {
                model.splice(length, args.length)
            }
        },

        pop: {
            createOp: useMutatingArrayOpFactory('pop'),
            revert(model, { output }) {
                model.push(output)
            }
        },

        unshift: {
            createOp: useMutatingArrayOpFactory('unshift', deionizeArgs),
            revert(model, { args }) {
                model.splice(0, args.length)
            }
        },

        shift: {
            createOp: useMutatingArrayOpFactory('shift'),
            revert(model, { output }) {
                model.unshift(output)
            }
        },

        splice: {
            createOp: useMutatingArrayOpFactory('splice', deionizeArgs),
            revert(model, { output, args }) {
                const start = args[0];
                const numItems = args.length - 2;
                model.splice(start, numItems, ...output)
            }
        },

        copyWithin: {
            createOp: useMutatingArrayOpFactory('copyWithin'),
            preop: fillOrCopyWithinPreop,
            revert: fillOrCopyWithinRevert
        },

        fill: {
            createOp: useMutatingArrayOpFactory('fill', (args: any) => toRaw(args[0])),
            preop: fillOrCopyWithinPreop,
            revert: fillOrCopyWithinRevert
        },

        reverse: {
            createOp: useMutatingArrayOpFactory('reverse'),
            revert(model) {
                model.reverse()
            }
        },

        sort: {
            createOp: useMutatingArrayOpFactory('sort'),
            preop(model) {
                return model.slice()
            },
            revert(model, { preopData: snapshot }) {
                for (let i = 0; i < model.length; i++) {
                    model[i] = snapshot[i]
                }
            }
        },
    },

    afterSet(ionicModel, meta, key, newValue, oldValue) {
        const op = isIntegerKey(key) ? getTrackedOp(ionicModel, 'at', key) : null
        if (op) {
            triggerIonicAtom(op)
        }

        const observedIndices = meta.observedEntryKeys
        if (observedIndices && key === 'length') {
            for (const indexKey of observedIndices) {
                if (typeof indexKey !== 'string') {
                    console.warn(`index key is not string. May need to refactor code`)
                    continue;
                }
                const index = parseInt(indexKey)
                if (index > newValue || index > oldValue) {
                    const prop = getObservedProp(ionicModel, indexKey)
                    if (prop) {
                        trigger(prop, newValue, oldValue)
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
    },

    isEntryKey(model, key){
        return !!(model instanceof Array && isIntegerKey(key))
    },
})

function fillOrCopyWithinPreop(model: AnyObject, args: any[] | undefined) {
    const start = args![1] ?? 0
    const end = args![2]
    return model.slice(start, end)
}

function fillOrCopyWithinRevert(model: AnyObject, data: { preopData: any[], args: any[] }) {
    const { preopData: slice, args } = data
    let index = args![1] ?? 0;
    for (let i = 0; i < slice.length; i++) {
        model[index] = slice[i];
        index++;
    }
}

function deionizeArgs(args: any[]) {
    const _args = []
    for (const arg of args) {
        _args.push(toRaw(arg))
    }
    return _args;
}

// export function createIonicArray(
//     target: any[],
//     methods: AnyObject | undefined
// ) {
//     const boundMethodMap: Map<string | symbol, Function> = new Map()
//     const metaIonicModel = new MetaIonicCollection(target, methods)
//     const ionicModel = new Proxy(target, {
//         get(target, key, receiver) {
//             return reactiveArrayGetter(
//                 ionicModel,
//                 methods,
//                 metaIonicModel,
//                 function handleMutatingMethod(key: string, fn) {
//                     return (...args: any[]) => {
//                         return useMutatingArrayOp(
//                             args,
//                             ionicModel,
//                             metaIonicModel,
//                             target,
//                             key,
//                             fn
//                         )
//                     }
//                 },
//                 <any[]>target,
//                 key,
//                 receiver,
//                 boundMethodMap
//             )
//         },
//         set(target, key, value, receiver) {
//             return reactiveArraySetter(
//                 ionicModel,
//                 metaIonicModel,
//                 target,
//                 key,
//                 value,
//                 receiver
//             )
//         }
//     }) as IonicModel<any[]>
//     metaIonicModel.initIonicModel(ionicModel)
//     registerIonicModel(ionicModel, target)
//     return ionicModel
// }


// export function createIonicTuple<T extends any[]>(
//     target: T,
//     methods: AnyObject | undefined
// ) {

//     const boundMethodMap: Map<string | symbol, Function> = new Map()
//     const metaIonicModel = new MetaIonicCollection(target, methods)
//     const ionicModel = new Proxy(target, {
//         get(target, key, receiver) {
//             return reactiveArrayGetter(
//                 ionicModel,
//                 methods,
//                 metaIonicModel,
//                 function handleMutatingMethod() {
//                     throw new Error("Tuples can only be mutated by index")
//                 },
//                 <any[]>target,
//                 key,
//                 receiver,
//                 boundMethodMap
//             )
//         },
//         set(target, key, value, receiver) {
//             return reactiveArraySetter(
//                 ionicModel,
//                 metaIonicModel,
//                 target,
//                 key,
//                 value,
//                 receiver
//             )
//         }
//     }) as IonicModel<any[]>
//     metaIonicModel.initIonicModel(ionicModel)
//     registerIonicModel(ionicModel, target)
//     return ionicModel
// }

// export function createReactiveArrayItems(
//     target: any[],
// ) {
//     for (let i = 0; i < target.length; i++) {
//         const item = target[i]
//         if (isIonicModel(item)) continue;
//         if (!(item instanceof Object)) continue;
//         const item$ = createIonicModel(item, DEEP)
//         if (item$ === null) continue;
//         target[i] = item$;
//     }
// }


// function reactiveArrayGetter(
//     ionicModel: IonicModel<Collection>,
//     methods: AnyObject | undefined,
//     metaIonicModel: MetaIonicCollection,
//     handleMutatingMethod: (key: string, fn: Function) => (...args: any[]) => any,
//     target: any[],
//     key: string | symbol,
//     receiver: AnyObject,
//     boundMethodMap: Map<string | symbol, Function>
// ) {
//     if (__DEV__) emitSignal();
//     if (key === META) return metaIonicModel;
//     const protectedMeta = getProtectedModelMeta(target, ionicModel, receiver)
//     if (protectedMeta) {
//         const keys = protectedMeta.propertyKeys
//         if (keys && !(key in keys)) {
//             if (__DEV__) console.warn(`Object is protected. Cannot access '${key.toString()}'`)
//             return undefined;
//         }
//     }
//     if (methods && key in methods) {
//         return accessMethod(
//             target,
//             ionicModel,
//             receiver,
//             key,
//             boundMethodMap,
//             methods[key]
//         )
//     }
//     // if (key === '_$' && deep) return asShallowReactive(target);
//     const value = Reflect.get(target, key, receiver);
//     if (typeof key === 'symbol' && key.description === 'Symbol.iterator') {
//         return value;
//     }
//     if (isNonTrackable(key, [Array])) return value;
//     if (isAnyIon(value) && !isIntegerKey(key)) return value();
//     if (isMutatingArrayMethod(key)) {
//         if (isReadonlyProxy(target, ionicModel, receiver)) {
//             if (__DEV__) console.warn('Object is readonly. Cannot access methods')
//             return undefined;
//         }
//         if (protectedMeta) {
//             const keys = protectedMeta.propertyKeys
//             if (keys && key in keys) {
//                 return handleMutatingMethod(<string>key, value);
//             }
//             return undefined;
//         }
//         return handleMutatingMethod(<string>key, value);
//     }
//     if (value instanceof Function)
//         return accessMethod(
//             target,
//             ionicModel,
//             receiver,
//             key,
//             boundMethodMap,
//             value
//         )
//     if (key === 'at') {
//         return useTrackableGetOp(
//             ionicModel,
//             target,
//             key,
//             value
//         )
//     }
//     const _value = maybeIonize(value, target, ionicModel, receiver)
//     const tracker = getActiveTracker()
//     if (!tracker) return _value;

//     tracker.track(asTrackedProp(ionicModel, key))
//     return _value;
// }


// function deionizeArgs(args: any[]) { // This is a generic deionize args function that will only deionize two layers down
//     const _args: any[] = []
//     for (const arg of args) {
//         if (isIonicModel(arg)) _args.push(toRaw(arg));
//         else if (arg instanceof Object) {
//             _args.push(deionizeProps(arg))
//         }
//         else {
//             _args.push(arg)
//         }
//     }
// }

// function deionizeProps(object: AnyObject) {
//     if (isCollection(object)){
//         return deionizeItems(object)
//     }
//     const _object: AnyObject = {}
//     for (const key in object) {
//         _object[key] = toRaw(object[key])
//     }
//     return _object;
// }

// function deionizeItems(collection: any[] | Map<any, any> | Set<any>) {

// }


// function reactiveArraySetter(
//     ionicModel: IonicModel,
//     metaIonicModel: MetaIonicModel,
//     target: AnyObject,
//     key: string | symbol,
//     newValue: any,
//     receiver: AnyObject
// ) {
//     if (isProtectedProxy(target, ionicModel, receiver)) {
//         if (__DEV__) console.warn('Set operation failed. Property is readonly')
//         return false;
//     }
//     if (metaIonicModel.isNewProperty(key)) metaIonicModel.registerNewProperty(key)

//     const _newValue = toRaw(newValue)
//     const op = target instanceof Array && isIntegerKey(key) ? getTrackedOp(ionicModel, 'at', key) : null;
//     const prop = getObservedProp(ionicModel, key);
//     if (!prop && !op) {
//         // Reflect.set(target, key, newValue, receiver);
//         target[key] = _newValue
//         return true;
//     }

//     const oldValue = Reflect.get(target, key, receiver);
//     if (isAnyIon(oldValue) && !isIntegerKey(key)) //TODO: replaceAbsorbedIon. //QUESTION: Should Indices absorb ions? Vue doesn't
//         return setAbsorbedIon(oldValue, _newValue)
//     if (oldValue === _newValue
//         || isNonTrackable(key, [Array])
//         || !isWritable(target, key)) {
//         // Reflect.set(target, key, newValue, receiver);
//         target[key] = _newValue
//         return true;
//     }


//     // Reflect.set(target, key, _newValue, receiver);
//     target[key] = _newValue // cannot use Reflect.set because it does not set the property synchronously

//     storeSnapshot(metaIonicModel)

//     if (prop) {
//         trigger(prop, _newValue, oldValue)
//     }

//     if (op) {
//         triggerIonicAtom(op)
//     }

//     const trackedIndices = metaIonicModel.observedEntryKeys
//     if (trackedIndices && key === 'length') {
//         for (const indexKey of trackedIndices) {
//             if (typeof indexKey !== 'string') {
//                 console.warn(`index key is not string. May need to refactor code`)
//                 continue;
//             }
//             const index = parseInt(indexKey)
//             if (index > _newValue || index > oldValue) {
//                 const prop = getObservedProp(ionicModel, indexKey)
//                 if (prop) {
//                     trigger(prop, _newValue, oldValue)
//                 }
//                 const op = getTrackedOp(ionicModel, 'at', index)
//                 if (op) {
//                     if (isIonicAtom(op)) {
//                         triggerIonicAtom(op)
//                     }
//                 }
//             }
//         }
//     }

//     triggerIonicModel(
//         ionicModel,
//         with_op = '[[set]]',
//         with_args = [key, _newValue],
//         with_output = _newValue,
//         with_preopData = oldValue,
//     )

//     return true;
// }





export function isIntegerKey(key: unknown) {
    const keyAsNumber = Number(key);
    if (isNaN(keyAsNumber)) return false;
    if (Number.isInteger(keyAsNumber)) return true
}



function useMutatingArrayOpFactory(
    opName: string,
    deionizeArgs?: (args: any[]) => any[]
) {
    return function createOp(target: AnyObject, ionicModel: IonicModel<AnyObject>, meta: MetaIonicModel<any[]>, getPreopData: GetPreopData | undefined) {
        const fn = target[opName]
        return useMutatingArrayOp(
            <IonicModel<any[]>>ionicModel,
            meta,
            <any[]>target,
            opName,
            fn,
            getPreopData,
            deionizeArgs
        )
    }
}

const lengthMutatingOps = {
    push: true,
    pop: true,
    shift: true,
    unshift: true,
}

function useMutatingArrayOp(
    ionicModel: IonicModel<any[]>,
    metaIonicModel: MetaIonicModel<any[]>,
    target: any[],
    key: string,
    fn: Function,
    getPreopData?: ((target: any[], args: any[]) => any),
    deionizeArgs?: (args: any[]) => any[]
) {
    return (...args: any[]) => {
        const preopData = getPreopData ? getPreopData(target, args) : undefined
        const _args = deionizeArgs ? deionizeArgs(args) : args
        const oldLength = target.length;
        const output = fn.apply(ionicModel, _args); // perform mutation
        const newLength = target.length;
        if (key in lengthMutatingOps && oldLength === newLength) return output;
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

        const observedIndices = metaIonicModel.observedEntryKeys
        if (observedIndices && oldLength < newLength) {
            for (const indexKey of observedIndices) {
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

        triggerIonicModel(
            ionicModel,
            key,
            _args,
            output,
            preopData
        )

        return output;
    }
}



export function isIonicArray(target: any): target is IonicModel<any[]> {
    if (!isIonicModel(target)) return false;
    if (toRaw(target) instanceof Array) return true;
    return false;
}