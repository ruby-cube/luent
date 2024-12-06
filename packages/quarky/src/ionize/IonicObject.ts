import { isIonizedModel, IonizedModel, toRaw, ionize, registerIonizedModel } from "./ionize";
import { defineIonizedStructure } from "./IonizedModel";

// export const runningIonicObject = true;

export function isIonicObject(value: any): value is IonizedModel {
    if (!isIonizedModel(value)) return false;
    const raw = toRaw(value);
    if (raw instanceof Map || raw instanceof Array || raw instanceof Set || raw instanceof Function) return false;
    return true;
}


// defineIonizedStructure()

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
//             if (isIon(value)) return value();
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
//                 // if (isIon(value)) return value();
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
//     }) as IonizedModel<AnyObject>

//     metaIonicModel.initIonicModel(ionicModel)
//     registerIonizedModel(ionicModel, target)
//     return ionicModel
// }



