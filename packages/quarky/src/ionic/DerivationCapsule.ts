import { IonicCompound, MaybeIonicCompound } from "./IonicCompound";
import { AnyObject } from "@rue/types";
import { AnyIon, Ion, IonMethods } from "../ion/Ion";
import { DerivedNeutron } from "../ion/Neutron";
import { getActiveFlask } from "@rue/flask";
import { quarksOf, QUARKS, Quarks, hasQuarks } from "../QuarkyEntity";
import { __DEV__initTraceability, attachCapsuleMethods, Capsule, CapsuleQuarks } from "../capsule/Capsule";
import { Muon } from "../reactivity/reactivity-system";
import { MaybeIonicAtom } from "./IonicAtom";
import { __DEV__label } from "../debug/DEVLabellable";

/**
* Managed Derivation Ion
* - memoization **
* ---retracking
* - provide previous state to derivation
* - encapsulates with methods
* ---- manage dev traces through quarky capsule **
**/

// /** INTERNAL */
export type $DerivationCapsule = Muon & Capsule & { //NOTE: For DEV only so that you don't have to go out of your way to make a derivation ion traceable
   [QUARKS]: __DEV__DerivationCapsule
}

/** 
 * INTERNAL 
 * */
export type __DEV__DerivationCapsule = {
}
   & Quarks<$DerivationCapsule>
   & CapsuleQuarks
   & MaybeIonicAtom
   & MaybeIonicCompound

export const DERIVATION_CAPSULE = Symbol('DEV Derivation Capsule')

export function isDerivationCapsule(value: unknown): value is $DerivationCapsule {
   return hasQuarks(value) && quarksOf(value).type === DERIVATION_CAPSULE
}

export function createDerivationCapsule(
   derivation: (previousValue?: unknown) => unknown,
   methods: AnyObject,
) {
   const capsule = {}
   function $capsuleIon() {
      return derivation()
   }

   $capsuleIon[QUARKS] = capsule
   $capsuleIon.__DEV__labelName = undefined
   $capsuleIon.__DEV__label = __DEV__label

   __DEV__initTraceability(capsule)

   attachCapsuleMethods('DerivationCapsule', $capsuleIon, methods)

   return $capsuleIon;
}
