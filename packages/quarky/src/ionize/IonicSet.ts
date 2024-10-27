import { AnyObject } from "@rue/types";
import { trigger, triggerIonicAtom, triggerIonicModel } from "../trigger";
import {  IonicModel, storeSnapshot, toRaw } from "./ionize";
import { defineIonicStructure, GetPreopData, useTrackableGetOp } from "./IonicModel";
import { getTrackedOp } from "./TrackedOp";
import { MetaIonicModel } from "./MetaIonicModel";
import { getObservedProp } from "./PropIon";


const trackableCollectionOps = {
    keys: true,  // newIterable = keys()
    entries: true, // newEntriesIterator = entries()
    values: true, // newIterable = values()
}

export const trackableIterableOps = {
    forEach: true,
    'Symbol.iterator': true
}

export const nontrackableIterableKeys = {
    forEach: true,
    'Symbol.iterator': true
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

export function installIonicSet(){ 
    defineIonicStructure(Set, {
        nontrackableKeys: nontrackableIterableKeys,
        trackableOps: {
            has(target, ionicModel) {
                return useTrackableGetOp(
                    ionicModel,
                    target,
                    'has',
                    target.has
                )
            }
        },
        mutatingOps: {
            add: {
                createOp(target, ionicModel, meta) {
    
                    return function add(newValue: any) {
                        const oldSize = target.size
                        const _newValue = toRaw(newValue)
                        const output = target.add(_newValue); //perform op
                        const newSize = target.size
    
    
                        if (oldSize === newSize) return;
                        storeSnapshot(meta)
    
                        const sizeProp = getObservedProp(ionicModel, 'size')
                        if (sizeProp)
                            trigger(sizeProp, newSize, oldSize);
    
                        const hasOp = getTrackedOp(ionicModel, 'has', _newValue)
                        if (hasOp) triggerIonicAtom(hasOp);
    
                        triggerIonicModel(
                            ionicModel,
                            'add',
                            [_newValue],
                            output
                        )
    
                        return output;
                    }
                },
    
                revert(model, data) {
                    model.delete(data.args[0])
                }
            },
            clear: {
                createOp(target, ionicModel, meta, getPreopData) {
    
                    return useClearOp(
                        ionicModel,
                        meta,
                        target,
                        getPreopData!
                    )
                },
    
                preop(model) {
                    return Array.from(<Set< any>>toRaw(model))
                },
    
                revert(ionicModel, { preopData }) {
                    for (const value of preopData) {
                        ionicModel.add(value) //QUESTION: not sure if this should be the raw target or the ionic model
                    }
                }
            },
            delete: {
                createOp(target, ionicModel, meta, getPreopData) {
    
                    return useDeleteOp(
                        ionicModel,
                        meta,
                        target,
                        getPreopData!
                    )
                },
    
                preop(model, args) {
                    return model[args![0]]
                },
    
                revert(ionicModel, { preopData }) {
                    ionicModel.add(preopData)
                }
            },
    
        }
    })
}


// export function createIonicSet(
//     target: Set<any>,
//     methods: AnyObject | undefined
// ) {
//     const metaIonicModel = new MetaIonicCollection(target, methods)

//     const ionicModel = new Proxy(target, {
//         get(target, key, receiver) {
//             if (__DEV__) emitSignal()
//             if (key === META) return metaIonicModel
//             const protectedMeta = getProtectedModelMeta(target, ionicModel, receiver)
//             if (protectedMeta) {
//                 const keys = protectedMeta.propertyKeys
//                 if (keys && !(key in keys)) {
//                     if (__DEV__) console.warn(`Object is protected. Cannot access '${key.toString()}'`)
//                     return undefined;
//                 }
//             }
//             if (methods && key in methods) {
//                 return accessMethod(
//                     target,
//                     ionicModel,
//                     receiver,
//                     key,
//                     boundMethodMap,
//                     methods[key]
//                 )
//             }

//             if (key in mutatingSetOps) {
//                 if (protectedMeta) {
//                     const keys = protectedMeta.propertyKeys
//                     if (keys && key in keys) {
//                         return accessMethod(
//                             target,
//                             ionicModel,
//                             receiver,
//                             key,
//                             boundMethodMap
//                         )
//                     }
//                     return undefined;
//                 }
//             }

//             const value = Reflect.get(target, key, receiver)

//             if (typeof key === 'symbol' && key.description === 'Symbol.iterator') {
//                 return value;
//             }

//             if (isNonTrackable(key, Set))
//                 return value;

//             if (isIon(value))
//                 return value();

//             if (value instanceof Function) {
//                 return accessMethod(
//                     target,
//                     ionicModel,
//                     receiver,
//                     key,
//                     boundMethodMap,
//                     value
//                 )
//             }
//             const _value = maybeIonize(value, target, ionicModel, receiver)
//             const tracker = getActiveTracker()
//             if (!tracker)
//                 return _value;
//             tracker.track(asTrackedProp(ionicModel, key))
//             return _value;
//         },
//         set(target, key, value, receiver) {
//             return reactiveSetter(
//                 Set,
//                 ionicModel,
//                 metaIonicModel,
//                 target,
//                 key,
//                 value,
//                 receiver
//             )
//         }
//     }) as IonicModel<Set<any>>

    // const boundMethodMap: Map<string | symbol, Function> = new Map([
    //     ['has', useTrackableGetOp(
    //         ionicModel,
    //         target,
    //         'has',
    //         target.has
    //     )],
    //     ['add', addOp],
    //     ['clear', useClearOp(
    //         ionicModel,
    //         metaIonicModel,
    //         target
    //     )],
    //     ['delete', useDeleteOp(
    //         ionicModel,
    //         metaIonicModel,
    //         target
    //     )]
    // ])

//     function addOp(newValue: any) {
//         const oldSize = target.size
//         const _newValue = toRaw(newValue)
//         const preopData = getPreopData(target, [_newValue])
//         const output = target.add(_newValue); //perform op
//         const newSize = target.size


//         if (oldSize === newSize) return;
//         storeSnapshot(metaIonicModel)

//         const sizeProp = getObservedProp(ionicModel, 'size')
//         if (sizeProp)
//             trigger(sizeProp, newSize, oldSize);

//         const hasOp = getTrackedOp(ionicModel, 'has', _newValue)
//         if (hasOp) triggerIonicAtom(hasOp);

//         triggerIonicModel(
//             ionicModel,
//             'add',
//             [_newValue],
//             output,
//             preopData
//         )

//         return output;
//     }

//     metaIonicModel.initIonicModel(ionicModel)
//     registerIonicModel(ionicModel, target)
//     return ionicModel
// }




export function useDeleteOp(
    ionicModel: IonicModel,
    metaIonicModel: MetaIonicModel,
    target: AnyObject,
    getPreopData: GetPreopData
) {
    return function deleteOp(key: any) {
        const oldSize = target.size
        const preopData = getPreopData(target, [key])
        const output = target.delete(key); //perform op
        const newSize = target.size

        if (oldSize === newSize) return;

        storeSnapshot(metaIonicModel)

        const sizeProp = getObservedProp(ionicModel, 'size')
        if (sizeProp)
            trigger(sizeProp, newSize, oldSize);

        const hasOp = getTrackedOp(ionicModel, 'has', key)
        if (hasOp) triggerIonicAtom(hasOp);

        if (target instanceof Map) {
            const getOp = getTrackedOp(ionicModel, 'get', key)
            if (getOp) triggerIonicAtom(getOp);
        }

        triggerIonicModel(
            ionicModel,
            'delete',
            [key],
            output,
            preopData
        )

        return output;
    }
}



export function useClearOp(
    ionicModel: IonicModel,
    metaIonicModel: MetaIonicModel,
    target: AnyObject,
    getPreopData: (model: IonicModel) => any
) {
    return function clearOp() {
        const preopData = getPreopData(ionicModel)
        const oldSize = target.size
        const output = target.clear(); //perform op
        const newSize = target.size

        if (oldSize === newSize) return;

        storeSnapshot(metaIonicModel)

        const trackedEntries = metaIonicModel.observedEntryKeys
        if (trackedEntries) {
            for (const entryKey of trackedEntries) {
                const hasOp = getTrackedOp(ionicModel, 'has', entryKey)
                if (hasOp) triggerIonicAtom(hasOp);

                if (target instanceof Map) {
                    const getOp = getTrackedOp(ionicModel, 'get', entryKey)
                    if (getOp) triggerIonicAtom(getOp);
                }
            }
        }

        const sizeProp = getObservedProp(ionicModel, 'size')
        if (sizeProp)
            trigger(sizeProp, newSize, oldSize);


        triggerIonicModel(
            ionicModel,
            'clear',
            [],
            output,
            preopData
        )

        return output;
    }
}


