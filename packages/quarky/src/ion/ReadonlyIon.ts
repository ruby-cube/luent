import {  CapsuleQuark } from "../capsule/Capsule";
import { asNonlocalReadonly } from "../capsule/Readonly";
import { quarkOf, QUARK } from "../Quark";
import { isIon, NonVoid, WritableIon } from "./ion";

type $WritableIon = (() => NonVoid) & {
   state: NonVoid;
} & {
   [QUARK]: CapsuleQuark;
}

export function createReadonlyIon($ion: $WritableIon) {
   const quark = quarkOf($ion)
   function $readonlyIon() {
      return asNonlocalReadonly($ion())
   }
   $readonlyIon[QUARK] = quark;
   return quark.asReadonly = $readonlyIon
}

export function isWritableIon(value: any): value is WritableIon {
   return isIon(value) && 'state' in value;
}