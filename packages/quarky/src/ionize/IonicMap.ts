import { trigger, triggerIonicAtom, triggerIonicModel } from "../trigger";
import { IonicModel, storeSnapshot, ionize, registerIonicModel, toRaw } from "./ionize";
import { nontrackableIterableKeys, useClearOp, useDeleteOp } from "./IonicSet";
import { asTrackedOp, getTrackedOp } from "./TrackedOp";
import { asTrackedProp, getObservedProp } from "./PropIon";
import { defineIonicStructure, useTrackableGetOp } from "./IonicModel";

// Trackable keys vs trackable ops:
// Trackable keys is about tracking the property
// trackable ops is about tracking the get op or the whole ionic model (depending on the type of operation)

const trackableMapGetOps = {
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


defineIonicStructure(Map, {
    nontrackableKeys: nontrackableIterableKeys,
    trackableOps: {
        has(target, ionicModel) {
            return useTrackableGetOp(
                ionicModel,
                target,
                'has',
                target.has
            )
        },
        get(target, ionicModel) {
            return useTrackableGetOp(
                ionicModel,
                target,
                'get',
                target.get
            )
        }
    },
    mutatingOps: {
        set: {
            createOp(target, ionicModel, meta) {

                return function set(key: any, newValue: any) {
                    const oldSize = target.size
                    const oldValue = target.get(key);
                    const _newValue = toRaw(newValue)
                    const output = target.set(key, _newValue); //perform op
                    const newSize = target.size

                    if (oldValue === _newValue) return;

                    storeSnapshot(meta)

                    if (oldSize !== newSize) {
                        const sizeProp = getObservedProp(ionicModel, 'size')
                        if (sizeProp)
                            trigger(sizeProp, newSize, oldSize);
                    }

                    const hasOp = getTrackedOp(ionicModel, 'has', key)
                    if (hasOp) triggerIonicAtom(hasOp);

                    const getOp = getTrackedOp(ionicModel, 'get', key)
                    if (getOp) triggerIonicAtom(getOp);

                    triggerIonicModel(
                        ionicModel,
                        with_op = 'set',
                        with_args = [key, _newValue],
                        with_output = output,
                        with_preopData = oldValue
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
                return Array.from(<Map<any, any>>model)
            },

            revert(ionicModel, { preopData }) {
                for (const [key, value] of preopData) {
                    ionicModel.set(key, value) //QUESTION: not sure if this should be the raw target or the ionic model
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
                const key = args![0];
                const value = model.get(key)
                return { key, value }
            },

            revert(ionicModel, { preopData }) {
                ionicModel.set(preopData.key, preopData.value)
            }
        },

    }
})
// export function createIonicMap(
//     target: Map<any, any>,
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
//             if (key in mutatingMapOps) {
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
//             if (isNonTrackable(key, Map))
//                 return value;
//             if (isAnyIon(value)) return value();

//             if (value instanceof Function)
//                 return accessMethod(
//                     target,
//                     ionicModel,
//                     receiver,
//                     key,
//                     boundMethodMap,
//                     value
//                 )
//             const _value = maybeIonize(value, target, ionicModel, receiver)
//             const tracker = getActiveTracker()
//             if (!tracker)
//                 return _value;
//             tracker.track(asTrackedProp(ionicModel, key))
//             return _value;
//         },
//         set(target, key, value, receiver) {
//             return reactiveSetter(
//                 Map,
//                 ionicModel,
//                 metaIonicModel,
//                 target,
//                 key,
//                 value,
//                 receiver
//             )
//         }
//     }) as IonicModel<Map<any, any>>


//     const boundMethodMap: Map<string | symbol, (...arg: any[]) => any> = new Map([
//         ['set', setOp],
//         ['has', useTrackableGetOp(
//             ionicModel,
//             target,
//             'has',
//             target.has
//         )],
//         ['get', useTrackableGetOp(
//             ionicModel,
//             target,
//             'get',
//             target.get
//         )],
//         ['clear', useClearOp(
//             ionicModel,
//             metaIonicModel,
//             target
//         )],
//         ['delete', useDeleteOp(
//             ionicModel,
//             metaIonicModel,
//             target
//         )]
//     ])

//     function setOp(key: any, newValue: any) {
//         const preopData = getPreopData(target)
//         const oldSize = target.size
//         const oldValue = target.get(key);
//         const _newValue = toRawIfNeeded(newValue)
//         const output = target.set(key, _newValue); //perform op
//         const newSize = target.size

//         if (oldValue === _newValue) return;

//         storeSnapshot(metaIonicModel)

//         const ionicModel = metaIonicModel.ionicModel!
//         if (oldSize !== newSize) {
//             const sizeProp = getObservedProp(ionicModel, 'size')
//             if (sizeProp)
//                 trigger(sizeProp, newSize, oldSize);
//         }

//         const hasOp = getTrackedOp(ionicModel, 'has', key)
//         if (hasOp) triggerIonicAtom(hasOp);
//         const getOp = getTrackedOp(ionicModel, 'get', key)
//         if (getOp) triggerIonicAtom(getOp);

//         triggerIonicModelWithMutation(
//             ionicModel,
//             'set',
//             [key, _newValue],
//             output
//         )

//         return output;
//     }

//     metaIonicModel.initIonicModel(ionicModel)
//     registerIonicModel(ionicModel, target)
//     return ionicModel
// }


