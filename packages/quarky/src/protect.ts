import { isWritableIon, ProtectedIon, protectIon, READONLY } from "./ion/ProtectedIon";
import { isIonicModel, IonicModel } from "./ionize/ionize";
import { AnyObject } from "@rue/types";
import { isProtectedIonicModel, isReadonlyIonicModel, protectIonicModel } from "./ionize/ProtectedIonicModel";


// export type ReadonlyIon<T = any> = {
//     (): T;
//     [READONLY_ION]: true
//     [META]: ReactiveEntity
// }

// export const READONLY_ION = Symbol('readonlySignal');
export function protect<T>(entity: T, methodKeys?: (T extends AnyObject ? { [K in keyof T]: true } : never) | typeof READONLY) {
    if (entity instanceof Function || !methodKeys && isProtectedIonicModel(entity) || isReadonlyIonicModel(entity)) 
        return entity;
    if (isWritableIon(entity)) {
        return protectIon(entity, methodKeys)
    }
    const _entity = toUnprotected(entity);
    if (isIonicModel(_entity)) {
        return protectIonicModel(_entity, methodKeys)
    }
    if (_entity instanceof Object) //TODO: 
        return __DEV__ ? createReadonlyObject(_entity) : entity
    return entity;
}

function toUnprotected(entity: any){
    if (isProtectedIonicModel(entity)){
        return Object.getPrototypeOf(entity)
    }
    return entity;
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

