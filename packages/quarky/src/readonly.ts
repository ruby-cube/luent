import { AnyObject } from "@rue/types";
import { asReadonlyIon, isWritableIon } from "./ion/ReinedIon";
import { isIonizedModel } from "./ionize/ionize";
import { asReadonlyIonizedModel } from "./ionize/ReadonlyIonizedModel";
import { isReinedObject, REINED_TARGET } from "./rein";

export function readonly<T>(entity: T) {
   if (isWritableIon(entity)) {
      return asReadonlyIon(entity)
   }
   if (isIonizedModel(entity)) {
      return asReadonlyIonizedModel(entity)
   }
   if (isReadonlyObject(entity))
      return entity;
   if (entity instanceof Object) {
      return createReadonlyObject(entity)
   }
   return entity
}



export function createReadonlyObject(obj: AnyObject) { //TODO: what about Arrays, Maps, and Sets for deep readonly
   const target = isReinedObject(obj) ? obj[REINED_TARGET] : obj;
   return new Proxy(obj, {
      get(target, key, receiver) {
         if (key === READONLY_TARGET) return target;
         return Reflect.get(target, key, receiver);
      },
      set() {
         console.warn('Set operation failed. Object is readonly.')
         return false;
      }
   })
}


export const READONLY_TARGET = Symbol('read-only target')

export function isReadonlyObject(value: any) {
   return value instanceof Object && READONLY_TARGET in value
}