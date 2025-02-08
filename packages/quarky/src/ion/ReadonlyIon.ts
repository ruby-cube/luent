import { Capsule, CapsuleQuarks } from "../capsule/Capsule";
import { asNonlocalReadonly } from "../nonlocal/NonlocalReadonly";
import { quarksOf, QUARKS, Quarks } from "../Quarks";
import { isIon, NonVoid, WritableIon } from "./Ion";

type $WritableIon = (() => NonVoid) & {
   state: NonVoid;
} & {
   [QUARKS]: CapsuleQuarks & Quarks;
}

export function createReadonlyIon($ion: $WritableIon) {
   const quarks = quarksOf($ion)
   function $readonlyIon() {
      return asNonlocalReadonly($ion())
   }
   $readonlyIon[QUARKS] = quarks;
   return quarks.asReadonly = $readonlyIon
}

export function isWritableIon(value: any): value is WritableIon {
   return isIon(value) && 'state' in value;
}