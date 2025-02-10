import { AnyObject } from "@rue/types";
import { quarksOf, QUARKS, hasQuarks, QuarksOf, EntityQuarks } from "../Quarks";
import { __DEV__initTraceability, attachCapsuleMethods, Capsule } from "../capsule/Capsule";
import { MaybeParticle } from "../Compound/Particle";
import { __DEV__label } from "../debug/DEVLabellable";
import { Ion } from "../ion/Ion";
import { MaybeCompound } from "../Compound/Compound";
import { Traceable } from "../debug/debug";

// USE CASE: Mainly for pions that need methods

/**
* Getter Ion Capsule
* - encapsulates with methods
*   - manage dev traces through quarky capsule **
**/


// /** INTERNAL */
export type $GetterIonState = Ion & Capsule & {
   [QUARKS]: MaybeParticle & MaybeCompound & EntityQuarks<$GetterIonState>
}

/** 
 * INTERNAL 
 * */
export type GetterIon = QuarksOf<$GetterIonState>


export const GETTER_ION = Symbol('GetterIon')

export function isDerivationCapsule(value: unknown): value is $GetterIonState {
   return hasQuarks(value) && quarksOf(<$GetterIonState>value).type === GETTER_ION
}

export function createGetterIon(
   derivation: () => unknown,
   methods?: AnyObject,
) {
   const capsule = {
      type: GETTER_ION,
      __DEV__asTraceable: new Traceable(),
   }
   function $capsuleIon() { // wrap so that name starts with $
      return derivation()
   }

   $capsuleIon[QUARKS] = capsule
   $capsuleIon.__DEV__labelName = undefined
   $capsuleIon.__DEV__label = __DEV__label

   if (methods) attachCapsuleMethods('GetterIon', $capsuleIon, methods)

   return $capsuleIon;
}
