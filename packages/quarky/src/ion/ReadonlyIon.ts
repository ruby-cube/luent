import { Capsule, MutableCapsule } from "../capsule/Capsule";
import { asNonlocalReadonly } from "../capsule/Readonly";
import { quarkOf, QUARK } from "../Quark";
import { AtomicIon, isIon, NonVoid } from "./ion";

type $WritableIon = (() => NonVoid) & {
   state: NonVoid;
} & MutableCapsule

export function createReadonlyIon($ion: $WritableIon) {
   const quark = quarkOf($ion)
   function $readonlyIon() {
      return asNonlocalReadonly($ion())
   }
   $readonlyIon[QUARK] = quark;
   return quark.asReadonly = $readonlyIon
}

export function isWritableIon(value: any): value is AtomicIon {
   return isIon(value) && 'state' in value;
}