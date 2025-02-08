import { untrackedCall } from "../ionic/IonicCompound";
import { isIon } from "../muon/Muon";
import { asNonlocalReadonly } from "../nonlocal/NonlocalReadonly";
import { quarksOf, QUARKS } from "../Quarks";
import { Ion } from "./Ion";

type WritableIon = Ion & { state: any }

export function createReadonlyIon(ion: WritableIon) {
   const quarks = quarksOf(ion)
   function $readonlyIon() {
      return asNonlocalReadonly(ion())
   }
   $readonlyIon[QUARKS] = quarks;
   Object.defineProperty($readonlyIon, 'state', {
      get(){
         return untrackedCall(ion)
      },
      set() {
         if (__DEV__) console.error('Set operation failed. Ion is readonly.')
            return false;
      }
   })
   return quarks.asReadonly = $readonlyIon
}

export function isWritableIon(value: any): value is WritableIon {
   return isIon(value) && 'state' in value;
}