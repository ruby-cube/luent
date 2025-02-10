import { AnyObject } from "@rue/types";
import { quarksOf, QUARKS, hasQuarks, QuarksOf, EntityQuarks } from "../Quarks";
import { __DEV__initTraceability, attachCapsuleMethods, Capsule } from "../capsule/Capsule";
import { MaybeParticle } from "../Compound/Particle";
import { __DEV__label } from "../debug/DEVLabellable";
import { Ion, NonVoid } from "../ion/Ion";
import { MaybeCompound, triggerEffects } from "../Compound/Compound";
import { Traceable } from "../debug/debug";
import { IonicCompound, MaybeIonicCompound } from "./IonicCompound";
import { unwatch, watch, Watchable, Watched } from "../watch/Watched";

// USE CASE: Mainly for pions that need methods

/**
* Getter Ion Capsule
* - encapsulates with methods
*   - manage dev traces through quarky capsule **
**/


// /** INTERNAL */
export type $GetterIonState = Ion & Capsule & {
   [QUARKS]: MaybeParticle & MaybeIonicCompound & EntityQuarks<$GetterIonState> & {inert: boolean}
   & Watchable
}

/** 
 * INTERNAL 
 * */
export type GetterIon = QuarksOf<$GetterIonState>


export const GETTER_ION = Symbol('GetterIon')

export function isDerivationCapsule(value: unknown): value is $GetterIonState {
   return hasQuarks(value) && quarksOf(<$GetterIonState>value).type === GETTER_ION
}

//TODO: needs to track call only when watched
export function createGetterIon(
   derivation: () => NonVoid,
   methods?: AnyObject,
) {
   let fn = derivation;
   const capsule: GetterIon = {
      inert: false,
      entity: $capsuleIon,
      asParticle: undefined,
      asCompound: undefined,
      asWatched: undefined,
      type: GETTER_ION,
      __DEV__asTraceable: new Traceable(),

      watch() {
         return watch(this, () => {
            fn = trackedCall
            const compound: IonicCompound = new IonicCompound(capsule)
            compound.trigger = () => triggerEffects(compound)
            this.asCompound = compound;
            return this.asWatched = new Watched(capsule)
         })
      },

      unwatch() {
         unwatch(capsule.asWatched!, () => {
            capsule.asCompound = undefined
            capsule.asWatched = undefined
         })
      }
   }
   function $capsuleIon() { // wrap so that name starts with $
      return fn()
   }

   function trackedCall() {
      fn = derivation;
      const compound = capsule.asCompound!
      const value = compound.trackedCall(derivation)
      if(compound.particles.length === 0) {
         capsule.inert = true;
         capsule.asCompound = undefined
      }
      return value;
   }

   $capsuleIon[QUARKS] = capsule
   $capsuleIon.__DEV__labelName = undefined
   $capsuleIon.__DEV__label = __DEV__label

   if (methods) attachCapsuleMethods('GetterIon', $capsuleIon, methods)

   return $capsuleIon;
}

