import { AnyObject } from "@rue/types";
import { isIonicModel, IonicModel, toRaw, ionize, registerIonicModel } from "./ionize";
import { getProtectedModelMeta, isProtectedProxy, isReadonlyProxy } from "./ProtectedIonicModel";
import { defineIonicStructure } from "./IonicModel";

export function isIonicObject(value: any): value is IonicModel {
    if (!isIonicModel(value)) return false;
    const raw = toRaw(value);
    if (raw instanceof Map || raw instanceof Array || raw instanceof Set || raw instanceof Function) return false;
    return true;
}


defineIonicStructure(Object, {
    isCollection: false,
    nonTrackableKeys: {
        constructor: true,
        __defineGetter__: true,
        __defineSetter__: true,
        // hasOwnProperty: true,
        __lookupGetter__: true,
        __lookupSetter__: true,
        isPrototypeOf: true,
        propertyIsEnumerable: true,
        toString: true,
        valueOf: true,
        __proto__: true,
        toLocaleString: true
    }
})

// export function createIonicObject(
//     target: AnyObject,
//     methods: AnyObject | undefined
// ) {
//     const boundMethodMap: Map<string | symbol, Function> = new Map()
//     const metaIonicModel = new MetaIonicModel(target, methods)
//     const ionicModel = new Proxy(target, {
//         get(target, key, receiver) {
//             if (__DEV__) emitSignal();
//             if (key === META) return metaIonicModel;
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
//             const value = Reflect.get(target, key, receiver);
//             if (isNonTrackable(key, [Object])) return value;
//             if (isAnyIon(value)) return value();
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
//             const tracker = getActiveTracker();
//             if (!tracker || Reflect.getOwnPropertyDescriptor(target, key)?.writable === false
//             ) {
//                 // if (isAnyIon(value)) return value();
//                 return _value;
//             }
//             tracker.track(asTrackedProp(ionicModel, key));
//             return _value;
//         },
//         set(target, key, value, receiver) {
//             return reactiveSetter(
//                 [Object],
//                 ionicModel,
//                 metaIonicModel!,
//                 target,
//                 key,
//                 value,
//                 receiver
//             )
//         }
//     }) as IonicModel<AnyObject>

//     metaIonicModel.initIonicModel(ionicModel)
//     registerIonicModel(ionicModel, target)
//     return ionicModel
// }



