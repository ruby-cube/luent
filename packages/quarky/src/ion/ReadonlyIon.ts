import { getWithoutTracking } from "../derivations/DependencyTracker";
import { asNonlocalReadonly } from "../NonlocalReadonly";
import { META } from "../ReactiveEntity";
import { Ion, isIon } from "./Ion";

type WritableIon = Ion & { state: any }

export function createReadonlyIon(ion: WritableIon) {
   const meta = ion[META]
   function $readonlyIon() {
      return asNonlocalReadonly(ion())
   }
   $readonlyIon[META] = meta;
   Object.defineProperty($readonlyIon, 'state', {
      get(){
         return getWithoutTracking(ion)
      },
      set() {
         if (__DEV__) console.error('Set operation failed. Ion is readonly.')
            return false;
      }
   })
   return meta.asReadonly = $readonlyIon
}

export function isWritableIon(value: any): value is WritableIon {
   return isIon(value) && 'state' in value;
}