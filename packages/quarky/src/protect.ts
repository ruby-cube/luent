import { isWritableIon, ProtectedIon, protectIon, READONLY } from "./ion/ProtectedIon";
import { isIonicModel, IonicModel } from "./ionize/IonicModel";
import { AnyObject } from "@rue/types";
import { protectIonicModel } from "./ionize/ProtectedIonicModel";


// export type ReadonlyIon<T = any> = {
//     (): T;
//     [READONLY_ION]: true
//     [META]: ReactiveEntity
// }

// export const READONLY_ION = Symbol('readonlySignal');
export function protect($entity: any, methodKeys?: string[] | typeof READONLY) {
    if (isWritableIon($entity)) {
        return protectIon($entity, methodKeys)
    }
    if (isIonicModel($entity)) {
        return protectIonicModel($entity, methodKeys)
    }
    if ($entity instanceof Function)
        return $entity;
    if ($entity instanceof Object)
        return __DEV__ ? createReadonlyObject($entity) : $entity
    return $entity;
}





function createReadonlyObject(obj: AnyObject) { //TODO: what about Arrays, Maps, and Sets?
    return new Proxy(obj, {
        get(target, key, receiver) {
            return Reflect.get(target, key, receiver);
        },
        set() {
            console.warn('Set operation failed. Object is readonly.')
            return false;
        }
    })
}


// export function asReadonly<R extends () => T | IonicModel, T>($entity: R): R extends ReactiveIon ? ProtectedIon<T> : R {
//     if (isDerivedIon($entity)) return $entity as R;
//     if (isIon($entity)) { //TODO: what about writeable and propIons?
//         return protectIon($entity, 'ro') as R extends ReactiveIon ? ProtectedIon<T> : R;
//     }
//     if (isIonicModel($entity)) {
//         //TODO: 
//         return $entity as R extends ReactiveIon ? ProtectedIon<T> : R;
//     }
//     return $entity as R extends ReactiveIon ? ProtectedIon<T> : R;
// }
