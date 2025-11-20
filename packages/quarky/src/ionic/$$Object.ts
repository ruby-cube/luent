import { isFunction } from "@rue/utils";
import { isIonicProxy, toRaw } from "./x_ionize";
import { IonicProxy } from "./Ionic";

// export const runningIonicObject = true;

export function isIonicObject(value: any): value is IonicProxy {
    if (!isIonicProxy(value)) return false;
    const raw = toRaw(value);
    return !(raw instanceof Map || raw instanceof Array || raw instanceof Set || isFunction(raw))
}


// defineIonizedStructure()

// export function createIonicObject(
//     target: AnyObject,
//     methods: AnyObject | undefined
// ) {
//     const boundMethodMap: Map<string | symbol, Function> = new Map()
//     const modelQuark = new ModelQuark(target, methods)
//     const ionicModel = new Proxy(target, {
//         get(target, key, receiver) {
//             if (__DEV__) emitSignal();
//             if (key === QUARK) return modelQuark;
//             const reinedMeta = getReinedMeta(target, ionicModel, receiver)
//             if (reinedMeta) {
//                 const keys = reinedMeta.propertyKeys
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
//             if (isFunction(value)) {
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
//             tracker.track(asPionQuark(ionicModel, key));
//             return _value;
//         },
//         set(target, key, value, receiver) {
//             return reactiveSetter(
//                 [Object],
//                 ionicModel,
//                 modelQuark!,
//                 target,
//                 key,
//                 value,
//                 receiver
//             )
//         }
//     }) as IonicProxy

//     modelQuark.initIonizedModel(ionicModel)
//     registerIonizedModel(ionicModel, target)
//     return ionicModel
// }



