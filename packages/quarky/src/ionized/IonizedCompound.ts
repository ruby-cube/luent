import { QUARKS, Quarks } from "../Quarks";
import { Watchable } from "../watch/Watched";
import { CapsuleQuarks } from "../capsule/Capsule";
import { MaybeParticle, Particle } from "../Compound/Particle";
import { AnyObject } from "@rue/types";
import { toRaw } from "./ionize";
import { isIon } from "../ion/Ion";
import { Compound, track, untrackParticles, MaybeCompound, triggerEffects } from "../Compound/Compound";
import { useEffectCycle } from "../watch/EffectCycle";
import { Mutation } from "../watch/watch";
import { IonizedModelQuarks } from "./IonizedModelQuarks";

//TODO: 



// export const MEMOIZED_ION = Symbol('Memoized Ion')

// export function isMemoizedIon(value: unknown): value is $MemoizedIon {
//    return hasQuarks(value) && quarksOf(value).type === MEMOIZED_ION
// }

// triggerDerivations(newValue: any, oldValue: any) {
//    for (const derivation of this.derivations) {
//       if (isIonizedModel(derivation.o)) { //TODO: move to IonizedCompound?
//          const reactive = derivation.o
//          const quarks = this.quarks;
//          useEffectCycle().recordOp(reactive, {
//             target: quarks,
//             op: 'set',
//             args: [newValue],
//             output: newValue,
//             preopData: oldValue
//          })
//       }
//       derivation.trigger();
//    }
// }


export class IonizedCompound implements Compound {

   constructor(
      readonly quarks: IonizedModelQuarks
   ) {
   }
   particles: Particle[] = []

   track = track

   trigger(mutation: Mutation): void {
      this.quarks.asParticle?.triggerCompounds(mutation)
      triggerEffects(this, mutation)
   }

   collectAbsorbedIons(ionicModel: AnyObject) {
      const target = toRaw(ionicModel) as AnyObject;
      for (const key in target) {
         const value = target[key]
         if (isIon(value)) {
            this.track(<MaybeParticle>value)
         }
      }
   }
   untrackParticles = untrackParticles
}
