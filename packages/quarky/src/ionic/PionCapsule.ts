import { AnyObject } from "@rue/types";
import { quarkOf, QUARK, hasQuark, QuarkOf, EntityQuark } from "../Quark";
import { attachCapsuleMethods, Capsule } from "../capsule/Capsule";
import { Ion, NonVoid } from "../ion/ion";
import { __DEV__label, Traceable } from "../debug/debug";
import { IonicCompound } from "./IonicCompound";
import { Watched } from "../watch/Watched";
import { noop } from "@rue/utils";
import { $AtomicPionState } from "../ion/AtomicPion";

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
* How is the getter ion different from Watched Derivation?
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
   [QUARK]: EntityQuark<$GetterIonState> & { type: symbol, inert: boolean, coreIon: undefined | $AtomicPionState }
}

/** 
 * INTERNAL 
 * */
export type GetterIon = QuarkOf<$GetterIonState>


export const GETTER_ION = Symbol('GetterIon')

export function isPionCapsule(value: unknown): value is $GetterIonState {
   return hasQuark(value) && quarkOf(<$GetterIonState>value).type === GETTER_ION
}

export function asCoreIon($state: $GetterIonState){
   return quarkOf($state).coreIon;
}

export function createPionCapsule(
   derivation: () => NonVoid,
   methods: AnyObject,
) {
   let compound: IonicCompound | undefined = new IonicCompound({ watch: noop as () => Watched, unwatch: noop })
   compound.trackedCall(derivation)
   const particles = compound.particles
   compound = undefined;

   if (particles.length > 1) {
      if (__DEV__) throw new Error('A getter ion cannot have more than one particle. Consider creating a derivation ion instead')
      return derivation;
   }

   const capsule: GetterIon = {
      inert: false,
      entity: $capsuleIon,
      coreIon: undefined,  // this is what needs to be returned as the watched ion, either a pion or an ion
      type: GETTER_ION,
      asTraceable: new Traceable(),
   }

   if (particles.length === 0) {
      capsule.inert = true;
   }
   else {
      capsule.coreIon = particles[0].quark.entity as $AtomicPionState
   }

   function $capsuleIon() { // wrap so that name starts with $
      return derivation()
   }

   $capsuleIon[QUARK] = capsule
   $capsuleIon.labelName = undefined
   $capsuleIon.__DEV__label = __DEV__label

   attachCapsuleMethods('GetterIon', $capsuleIon, methods)

   return $capsuleIon;
}

