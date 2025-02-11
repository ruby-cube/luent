import { MaybeParticle, Particle } from "../Compound/Particle";
import { AnyObject } from "@rue/types";
import { toRaw } from "./ionize";
import { isIon } from "../ion/Ion";
import { Compound, track, untrackParticles, MaybeCompound, triggerEffects } from "../Compound/Compound";
import { Mutation } from "../watch/watch";
import { IonizedModelQuark } from "./IonizedModelQuark";

//TODO: 



// export const MEMOIZED_ION = Symbol('Memoized Ion')

// export function isMemoizedIon(value: unknown): value is $MemoizedIon {
//    return hasQuark(value) && quarkOf(value).type === MEMOIZED_ION
// }

// triggerDerivations(newValue: any, oldValue: any) {
//    for (const derivation of this.derivations) {
//       if (isIonizedModel(derivation.o)) { //TODO: move to IonizedCompound?
//          const reactive = derivation.o
//          const quark = this.quark;
//          useEffectCycle().recordOp(reactive, {
//             target: quark,
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
      readonly quark: IonizedModelQuark
   ) {
   }
   particles: Particle[] = []

   track = track

   trigger(mutation: Mutation): void {
      this.quark.recordOp?.(mutation)
      this.quark.asParticle?.triggerCompounds(mutation)
      triggerEffects(this)
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
