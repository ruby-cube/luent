import { AnyObject } from "@rue/types";
import { asReadonlyIon, isWritableIon } from "./ion/ReinedIon";
import { isIonizedModel } from "./ionize/ionize";
import { asReadonlyIonizedModel } from "./ionize/ReadonlyIonizedModel";

export function readonly<T>(entity: T) {
   if (isWritableIon(entity)) {
      return asReadonlyIon(entity)
   }
   if (isIonizedModel(entity)) {
      return asReadonlyIonizedModel(entity)
   }
   if (entity instanceof Object)
      return createReadonlyObject(entity)
   return entity
}



export function createReadonlyObject(obj: AnyObject) { //TODO: what about Arrays, Maps, and Sets?
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
