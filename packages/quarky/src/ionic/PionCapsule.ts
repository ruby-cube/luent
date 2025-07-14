import { AnyObject } from "@rue/types";
import { quarkOf, QUARK, hasQuark, QuarkOf, Quark } from "../Quark";
import { attachCapsuleMethods, Capsule } from "../capsule/Capsule";
import { Ion } from "../ion/Ion";
import { IonicCompound } from "./IonicCompound";
import { Traceable } from "../debug/Traceable";
import { Watchable } from "../watch/WatchedAtom";

//NOTE: DEFERRED / DEPRECATED until further notice

// USE CASE: 
// For pions that need methods
// so that simple ions don't need to incur the overhead of memoized ions

/**
* Getter Ion Capsule
* - encapsulates with methods
*   - manage dev traces through quarky capsule **
* 
* 
* The getter ion is an interesting entity because
* it is not memoized, but it 
* 
* How is the getter ion different from WatchedAtom Derivation?
* 
* Both: 
* - may or may not be reactive (we don't know until we call)
* 
* Getter ion:
* - optional methods
* - it only becomes a compound, that tracks calls when it is watched .. I don't think it should 
* - because it is not memoized, it doesn't need to be a particle node
* 
* - **because it is purly a getter, it does not need to be retracked like a watched derivation
* - once we know the observed ion, we don't need to retrack it
**/




// /** INTERNAL */
export type $GetterIonState = Ion & Capsule & {
   [QUARK]: Quark<typeof GETTER_ION, $GetterIonState> & { inert: boolean, coreQuark: Quark & Watchable }
}

/** 
 * INTERNAL 
 * */
export type GetterIon = QuarkOf<$GetterIonState>


export const GETTER_ION = Symbol('GetterIon')

export function isPionCapsule(value: unknown): value is $GetterIonState {
   return hasQuark(value) && quarkOf(<$GetterIonState>value).quarkType === GETTER_ION
}

export function asCoreQuark($state: $GetterIonState){
   return quarkOf($state).coreQuark;
}

export function createPionCapsule(
   derivation: () => unknown,
   methods: AnyObject,
) {
   let compound: IonicCompound | undefined = new IonicCompound()
   compound.trackedCall(derivation)
   const atoms = compound.atoms
   compound = undefined;

   if (atoms.size > 1) {
      if (__DEV__) throw new Error('A getter ion cannot have more than one particle. Consider creating a derivation ion instead')
      return derivation;
   }

   const capsule: GetterIon = {
      inert: false,
      entity: $capsuleIon,
      coreQuark: undefined as unknown as Quark,
      quarkType: GETTER_ION,
      asTraceable: new Traceable(),
   }

   if (atoms.size === 0) {
      capsule.inert = true;
      capsule.coreQuark = capsule
   }
   else {
      capsule.coreQuark = Array.from(atoms)[0] as Quark
   }

   function $capsuleIon() { // wrap so that name starts with $
      return derivation()
   }

   $capsuleIon[QUARK] = capsule
   $capsuleIon.labelName = undefined
   // $capsuleIon.__DEV__label = __DEV__label

   attachCapsuleMethods('GetterIon', $capsuleIon, methods)

   return $capsuleIon;
}

